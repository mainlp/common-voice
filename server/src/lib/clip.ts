import { NextFunction, Request, Response } from 'express';
import * as fs from 'fs';
import { join, resolve } from 'path';
const PromiseRouter = require('express-promise-router');
import { getConfig } from '../config-helper';
import Model from './model';
import getLeaderboard from './model/leaderboard';
import { earnBonus, hasEarnedBonus } from './model/achievements';
import * as Basket from './basket';
import * as Sentry from '@sentry/node';
import Bucket from './bucket';
import Awards from './model/awards';
import { checkGoalsAfterContribution } from './model/goals';
import { ChallengeToken, challengeTokens } from 'common';
import validate from './validation';
import { clipsSchema } from './validation/clips';
import { pipe } from 'fp-ts/lib/function';
import { option as O, taskEither as TE, task as T, identity as Id, comonad } from 'fp-ts';
import { Clip as ClientClip } from 'common';
import { FindVariantsBySentenceIdsResult, findVariantsBySentenceIdsInDb } from '../application/sentences/repository/variant-repository';

const { promisify } = require('util');
const Transcoder = require('stream-transcoder');
const { Converter } = require('ffmpeg-stream');
const { Readable, PassThrough } = require('stream');
const mp3Duration = require('mp3-duration');
const calcMp3Duration = promisify(mp3Duration);
const MIN_CLIP_DURATION = 1000;
const MAX_CLIP_DURATION = 15000;
// Read location is pushed to the frontend which already runs inside /code/web
const AUDIO_READ_LOCATION =  '/public/audio';
const AUDIO_WRITE_LOCATION =  '/code/web/public/audio';

enum ERRORS {
  MISSING_PARAM = 'MISSING_PARAM',
  CLIP_NOT_FOUND = 'CLIP_NOT_FOUND',
  SENTENCE_NOT_FOUND = 'SENTENCE_NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_SAVE_ERROR = 'AUDIO_FILE_NOT_SAVED'
}

/**
 * Clip - Responsibly for saving and serving clips.
 */
export default class Clip {
  private bucket: Bucket;
  private model: Model;

  constructor(model: Model) {
    this.model = model;
    this.bucket = new Bucket(this.model);
  }

  getRouter() {
    const router = PromiseRouter({ mergeParams: true });

    router.use(
      (
        { client_id, params }: Request,
        response: Response,
        next: NextFunction
      ) => {
        const { locale } = params;

        if (client_id && locale) {
          this.model.db
            .saveActivity(client_id, locale)
            .catch((error: any) => console.error('activity save error', error));
        }

        next();
      }
    );

    router.post('/:clipId/votes', this.saveClipVote);
    router.post('/:clipId/comment', this.saveComment);
    router.post('*', this.saveClip);

    router.get('/daily_count', this.serveDailyCount);
    router.get('/stats', this.serveClipsStats);
    router.get('/leaderboard', this.serveClipLeaderboard);
    router.get('/votes/leaderboard', this.serveVoteLeaderboard);
    router.get('/voices', this.serveVoicesStats);
    router.get('/votes/daily_count', this.serveDailyVotesCount);
    router.get('/:clip_id', this.serveClip);
    router.get('*', validate({ query: clipsSchema }), this.serveRandomClips);

    return router;
  }

  /*
   * Helper function to send error message to client, and save to Sentry
   * defaults to save_clip_error
   */
  clipSaveError(
    headers: any,
    response: Response,
    status: number,
    msg: string,
    fingerprint: string,
    type: 'vote' | 'clip'
  ) {
    const compiledError = `save_${type}_error: ${fingerprint}: ${msg}`;
    response.status(status).send(compiledError);

    Sentry.withScope(scope => {
      // group errors together based on their request and response
      scope.setFingerprint([`save_${type}_error`, fingerprint]);
      Sentry.captureEvent({ request: { headers }, message: compiledError });
    });
  }

  serveClip = async ({ params }: Request, response: Response) => {
    const url = await this.bucket.getClipUrl(params.clip_id);
    if (url) {
      response.redirect(await this.bucket.getClipUrl(params.clip_id));
    } else {
      response.json({});
    }
  };

  saveClipVote = async (
    { client_id, body, params, headers }: Request,
    response: Response
  ) => {
    const id = params.clipId as string;
    const { isValid, comment, challenge } = body;

    if (!id || !client_id) {
      this.clipSaveError(
        headers,
        response,
        400,
        `missing parameter: ${id ? 'client_id' : 'clip_id'}`,
        ERRORS.MISSING_PARAM,
        'vote'
      );
      return;
    }

    const clip = await this.model.db.findClip(id);
    if (!clip) {
      this.clipSaveError(
        headers,
        response,
        422,
        `clip not found`,
        ERRORS.CLIP_NOT_FOUND,
        'vote'
      );
      return;
    }

    const glob = clip.path.replace('.mp3', '');

    await this.model.db.saveVote(id, client_id, isValid, comment);
    await Awards.checkProgress(client_id, { id: clip.locale_id });
    await checkGoalsAfterContribution(client_id, { id: clip.locale_id });
    // move it to the last line and leave a trace here in case of serious performance issues
    // response.json(ret);

    Basket.sync(client_id).catch(e => console.error(e));
    const ret = challengeTokens.includes(challenge)
      ? {
        glob: glob,
        showFirstContributionToast: await earnBonus('first_contribution', [
          challenge,
          client_id,
        ]),
        hasEarnedSessionToast: await hasEarnedBonus(
          'invite_contribute_same_session',
          client_id,
          challenge
        ),
        showFirstStreakToast: await earnBonus('three_day_streak', [
          client_id,
          client_id,
          challenge,
        ]),
        challengeEnded: await this.model.db.hasChallengeEnded(challenge),
      }
      : { glob };
    response.json(ret);
  };

  /**
   * Save the request body as an audio file.
   * Ensure errors from this function include the term save_clip_error
   * to be easily parsed from other errors
   */
  saveClip = async (request: Request, response: Response) => {
    const { client_id, headers } = request;
    const sentenceId = headers.sentence_id as string;
    const source = headers.source || 'unidentified';
    const format = headers['content-type'];
    const size = headers['content-length'];

    if (!sentenceId || !client_id) {
      this.clipSaveError(
        headers,
        response,
        400,
        `missing parameter: ${sentenceId ? 'client_id' : 'sentence_id'}`,
        ERRORS.MISSING_PARAM,
        'clip'
      );
      return;
    }

    const sentence = await this.model.db.findSentence(sentenceId);
    if (!sentence) {
      this.clipSaveError(
        headers,
        response,
        422,
        `sentence not found`,
        ERRORS.SENTENCE_NOT_FOUND,
        'clip'
      );
      return;
    }

    // Where is our audio clip going to be located?
    const folder = client_id + '/';
    const filePrefix = sentenceId;
    const clipFileName = folder + filePrefix + '.mp3';
    const metadata = `${clipFileName} (${size} bytes, ${format}) from ${source}`;
    const userDir = join(AUDIO_WRITE_LOCATION, folder);
    const clipLocation = join(AUDIO_WRITE_LOCATION, clipFileName);

    // Create user directory if it doesn't exist
    try {
      await fs.promises.mkdir(userDir, { recursive: true });
    } catch (err) {
      console.error('Error creating directory:', err);
      this.clipSaveError(
        headers,
        response,
        500,
        `Error creating directory: ${err.message}`,
        ERRORS.FILE_SAVE_ERROR,
        'clip'
      );
      return;
    }

    if (await this.model.db.clipExists(client_id, sentenceId)) {
      this.clipSaveError(
        headers,
        response,
        204,
        `${clipFileName} already exists`,
        ERRORS.ALREADY_EXISTS,
        'clip'
      );
      return;
    } else {
      let audioInput = request;

      if (getConfig().FLAG_BUFFER_STREAM_ENABLED && format.includes('aac')) {
        // aac data comes wrapped in an mpeg container, which is incompatible with
        // ffmpeg's piped stream functions because the moov bit comes at the end of
        // the stream, at which point ffmpeg can no longer seek back to the beginning
        // createBufferedInputStream will create a local file and pipe data in as
        // a file, which doesn't lose the seek mechanism

        const converter = new Converter();
        const audioStream = Readable.from(request);

        audioInput = converter.createBufferedInputStream();
        audioStream.pipe(audioInput);
      }

      const pass = new PassThrough();
      let chunks: any = [];

      pass.on('error', (error: string) => {
        this.clipSaveError(
          headers,
          response,
          500,
          `${error}`,
          `ffmpeg ${error}`,
          'clip'
        );
        return;
      });

      pass.on('data', function(chunk: any) {
        chunks.push(chunk);
      });

      const audioOutput = new Transcoder(audioInput)
        .audioCodec('mp3')
        .format('mp3')
        .channels(1)
        .sampleRate(32000)
        .stream()
        .pipe(pass);
      const outputWriteStream = fs.createWriteStream(clipLocation);
      audioOutput.pipe(outputWriteStream);

      outputWriteStream.on('finish', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const durationInMs = await calcMp3Duration(buffer) * 1000;

          if (durationInMs < MIN_CLIP_DURATION || durationInMs > MAX_CLIP_DURATION) {
            throw new Error('Bad clip length: ' + durationInMs);
          }

          await this.model.saveClip({
            client_id: client_id,
            localeId: sentence.locale_id,
            original_sentence_id: sentenceId,
            path: clipFileName,
            sentence: sentence.text,
            duration: durationInMs,
          });

          console.log(`clip written to s3 ${metadata}`);

          await Awards.checkProgress(client_id, { id: sentence.locale_id });

          await checkGoalsAfterContribution(client_id, {
            id: sentence.locale_id,
          });

          Basket.sync(client_id).catch(e => console.error(e));

          const challenge = headers.challenge as ChallengeToken;
          const ret = challengeTokens.includes(challenge)
            ? {
              filePrefix: filePrefix,
              showFirstContributionToast: await earnBonus(
                'first_contribution',
                [challenge, client_id]
              ),
              hasEarnedSessionToast: await hasEarnedBonus(
                'invite_contribute_same_session',
                client_id,
                challenge
              ),
              showFirstStreakToast: await earnBonus('three_day_streak', [
                client_id,
                client_id,
                challenge,
              ]),
              challengeEnded: await this.model.db.hasChallengeEnded(
                challenge
              ),
            }
            : { filePrefix };
          response.json(ret);
        } catch (err) {
          console.error('Error saving clip to database:', err);
          this.clipSaveError(
            headers,
            response,
            500,
            `Error saving clip to database`,
            ERRORS.DATABASE_ERROR,
            'clip'
          );
        }
      });

      outputWriteStream.on('error', (err) => {
        console.error('Error saving MP3 file:', err);
        this.clipSaveError(
          headers,
          response,
          500,
          `Error saving MP3 file: ${err.message}`,
          ERRORS.FILE_SAVE_ERROR,
          'clip'
        );
      });
    }
  };

  saveComment = async (request: Request, response: Response) => {
    const { client_id, headers, body } = request;
    const sentenceId = headers.sentence_id as string;
    if (!sentenceId || !client_id) {
      this.clipSaveError(
        headers,
        response,
        400,
        `missing parameter: ${sentenceId ? 'client_id' : 'clip_id'}`,
        ERRORS.MISSING_PARAM,
        'clip'
      );
      return;
    }

    const sentence = await this.model.db.findSentence(sentenceId);
    if (!sentence) {
      this.clipSaveError(
        headers,
        response,
        422,
        `clip not found`,
        ERRORS.CLIP_NOT_FOUND,
        'clip'
      );
      return;
    }
    try{
      const result = await this.model.db.saveClipComment(sentenceId, client_id, body.comment);
      console.log(result)
      response.json({ success: result });
    }
    catch (error) {
      console.error("Error in saveComment:", error);
      response.status(500).json({ error: 'Failed to save comment' });
    }
  };

  serveRandomClips = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    const { client_id, params } = request;
    const count = Number(request.query.count) || 1;
    const clips = await this.getRandomClips(
      client_id,
      params.locale,
      count
    ).then(this.appendMetadata);
    response.json(clips);
  };

  /**
   * Moved this function from bucket.ts as we host audio clips locally and not on AWS
   * NOTE: This function won't serve clips that you recorded with the same browser. This is to prevent
   * users from validating the same clips they recorded. To test in a local environment, you can just
   * open the webpage in a different browser.
   */
  async getRandomClips(
    client_id: string,
    locale: string,
    count: number
  ): Promise<ClientClip[]> {
    // Get more clip IDs than are required in case some are broken links or clips
    const clips = await this.model.findEligibleClips(
      client_id,
      locale,
      Math.ceil(count * 1.5)
    )
    const clipPromises: ClientClip[] = []

    Sentry.captureMessage(
      `Got ${clips.length} eligible clips for ${locale} locale`,
      Sentry.Severity.Info
    )

    // Use for instead of .map so that it can break once enough clips are assembled
    for (let i = 0; i < clips.length; i++) {
      const { id, path, sentence, original_sentence_id, taxonomy } = clips[i]

      try {
        clipPromises.push({
          id: id.toString(),
          glob: path.replace('.mp3', ''),
          sentence: { id: original_sentence_id, text: sentence, taxonomy },
          audioSrc: join(AUDIO_READ_LOCATION,path),
        })
      
        // this will break either when 10 clips have been retrieved or when 15 have been tried
        // as long as at least 1 clip is returned, the next time the cache refills it will try
        // for another 15
        if (clipPromises.length == count) break
      } catch (e) {
        console.log(e.message)
        console.log(`Storage error retrieving clip_id ${id}`)
        await this.model.db.markInvalid(id.toString())
      }
    }
    Sentry.captureMessage(
      `Having a total of ${clipPromises.length} clips for ${locale} locale`,
      Sentry.Severity.Info
    )
    console.log(`Having a total of ${clipPromises.length} clips for ${locale} locale`)
    return Promise.all(clipPromises)
  }

  private appendMetadata = async (clips: ClientClip[]) => {
    const sentenceIds = clips.map(c => c.sentence.id);

    const sentenceVariants = await pipe(
      sentenceIds,
      findVariantsBySentenceIdsInDb,
      TE.getOrElse(() => T.of({} as FindVariantsBySentenceIdsResult))
    )()

    for (const clip of clips) {
      const sentenceId = clip.sentence.id
      const variant = sentenceVariants[sentenceId] || O.none
      clip.sentence.variant = pipe(
        variant,
        O.getOrElse(() => null)
      )
    }

    return clips
  }

  serveDailyCount = async (request: Request, response: Response) => {
    response.json(
      await this.model.db.getDailyClipsCount(request.params.locale)
    );
  };

  serveDailyVotesCount = async (request: Request, response: Response) => {
    response.json(
      await this.model.db.getDailyVotesCount(request.params.locale)
    );
  };

  serveClipsStats = async ({ params }: Request, response: Response) => {
    response.json(await this.model.getClipsStats(params.locale));
  };

  serveVoicesStats = async ({ params }: Request, response: Response) => {
    response.json(await this.model.getVoicesStats(params.locale));
  };

  serveClipLeaderboard = async (request: Request, response: Response) => {
    const { client_id, params } = request;
    const cursor = this.getCursorFromQuery(request);
    const leaderboard = await getLeaderboard({
      dashboard: 'stats',
      type: 'clip',
      client_id,
      cursor,
      locale: params.locale,
    });
    response.json(leaderboard);
  };

  serveVoteLeaderboard = async (request: Request, response: Response) => {
    const { client_id, params } = request;
    const cursor = this.getCursorFromQuery(request);
    const leaderboard = await getLeaderboard({
      dashboard: 'stats',
      type: 'vote',
      client_id,
      cursor,
      locale: params.locale,
    });
    response.json(leaderboard);
  };

  private getCursorFromQuery(request: Request) {
    const { cursor } = request.query;

    if (!cursor || typeof cursor !== 'string') {
      return null;
    }

    return JSON.parse(cursor);
  }
}
