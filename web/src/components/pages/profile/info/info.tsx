import {
  Localized,
  withLocalization,
  WithLocalizationProps,
} from '@fluent/react';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { Tooltip } from 'react-tippy';
import pick from 'lodash.pick';

import {
  useAction,
  useAPI,
  useLocalStorageState,
} from '../../../../hooks/store-hooks';
import { trackProfile } from '../../../../services/tracker';
import {
  REGIONS,
  GENDERS,
  MIN_AGE,
  MAX_AGE,
} from '../../../../stores/demographics';
import { Notifications } from '../../../../stores/notifications';
import { useTypedSelector } from '../../../../stores/tree';
import { Uploads } from '../../../../stores/uploads';
import { User } from '../../../../stores/user';
import URLS from '../../../../urls';
import { LocaleLink, useLocale } from '../../../locale-helpers';
import TermsModal from '../../../terms-modal';
import {
  Button,
  Hr,
  LabeledCheckbox,
  LabeledInput,
  LabeledSelect,
  Options,
} from '../../../ui/ui';
import { isEnrolled } from '../../dashboard/challenge/constants';
import { UserLanguage, UserClient } from 'common';

import ExpandableInformation from '../../../expandable-information/expandable-information';

import './info.css';

function ProfileInfo({
  getString,
  history,
}: WithLocalizationProps & RouteComponentProps) {
  const api = useAPI();
  const [locale, toLocaleRoute] = useLocale();
  const user = useTypedSelector(({ user }) => user);
  const { account, userClients } = user;

  const addNotification = useAction(Notifications.actions.addPill);
  const addUploads = useAction(Uploads.actions.add);
  const saveAccount = useAction(User.actions.saveAccount);

  const [userFields, setUserFields] = useState<{
    username: string;
    visible: number | string;
    age: number;
    region: string;
    gender: string;
    sendEmails: boolean;
    privacyAgreed: boolean;
  }>({
    username: '',
    visible: 0,
    age: 18,
    region: '',
    gender: '',
    sendEmails: false,
    privacyAgreed: false,
  });
  const { username, visible, age, region, gender, sendEmails, privacyAgreed } =
    userFields;
  const [areLanguagesLoading, setAreLanguagesLoading] = useState(true);
  const [userLanguages, setUserLanguages] = useState<UserLanguage[]>([]);
  const [userLanguagesInLocalStorage] = useLocalStorageState<UserLanguage[]>(
    [],
    'userLanguages'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [termsStatus, setTermsStatus] = useState<null | 'show' | 'agreed'>(
    null
  );
  const isEnrolledInChallenge =
    user?.userClients[0]?.enrollment || isEnrolled(account);

  useEffect(() => {
    if (user.isFetchingAccount || areLanguagesLoading) {
      return;
    }

    if (!account && userClients.length == 0) {
      history.push('/');
    }

    setUserFields({
      ...userFields,
      sendEmails: !!account?.basket_token,
      visible: 0,
      ...pick(user, 'ageNum', 'username', 'gender'),
      ...(account
        ? pick(account, 'ageNum', 'username', 'gender', 'visible')
        : {
            ageNum: userClients.reduce((init, u) => u.age || init, 18),
            gender: userClients.reduce((init, u) => u.gender || init, ''),
          }),
      privacyAgreed: Boolean(account) || user.privacyAgreed,
    });

    if (account) {
      setUserLanguages(account.languages);
      return;
    }

    let userLanguages: UserLanguage[] = [];
    userLanguages = userClients.reduce(
      (languages, userClient) => languages.concat(userClient.languages || []),
      userLanguagesInLocalStorage
    );
    userLanguages = userLanguages.filter(
      (l1, i) => i == userLanguages.findIndex(l2 => l2.locale == l1.locale)
    );

    setUserLanguages(userLanguages);
  }, [user, areLanguagesLoading]);

  const handleChangeFor =
    (field: string) =>
    ({ target }: React.ChangeEvent<HTMLInputElement>) => {
      setUserFields({
        ...userFields,
        [field]: target.type == 'checkbox' ? target.checked : target.value,
      });
    };

  const submit = useCallback(() => {
    const uc: UserClient = {
      ageNum: userFields.age,
      gender: userFields.gender,
      region: userFields.region,
    };
    this.props.api.updateMetadata(uc);
    /*
    if (!user.account) {
      trackProfile('create', locale);

      if (termsStatus == null) {
        setTermsStatus('show');
        return;
      }
    }

    setIsSaving(true);
    setIsSubmitted(true);
    setTermsStatus('agreed');

    const data = {
      ...pick(userFields, 'username', 'gender'),
      languages: userLanguages.filter(l => l.locale),
      visible: JSON.parse(visible.toString()),
      client_id: user.userId,
      ageNum: age,
      enrollment: user.userClients[0].enrollment || {
        team: null,
        challenge: null,
        invite: null,
      },
    };

    addUploads([
      async () => {
        await saveAccount(data);
        if (!user.account?.basket_token && sendEmails) {
          await api.subscribeToNewsletter(user.userClients[0]?.email);
        }

        addNotification(getString('profile-form-submit-saved'));
        setIsSaving(false);
      },
    ]);*/
  }, [api, userFields]);

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      console.log(userFields);
      const uc: UserClient = {
        ageNum: userFields.age,
        gender: userFields.gender,
        region: userFields.region,
      };
      api.updateMetadata(uc);
      //submit();
    },
    [api, submit]
  );

  return (
    <div className="profile-info">
      <Localized id="profile">
        <h1 />
      </Localized>

      <Localized id="why-profile-text">
        <p />
      </Localized>

      <ExpandableInformation summaryLocalizedId="why-demographic">
        <Localized id="why-demographic-explanation-2">
          <div />
        </Localized>
      </ExpandableInformation>

      <form onSubmit={handleSubmit}>
        <div className="form-fields">
          <Localized id="profile-form-username" attrs={{ label: true }}>
            <LabeledInput
              value={username}
              onChange={handleChangeFor('username')}
              name="username"
            />
          </Localized>

          <LabeledSelect
            value={region}
            label="Region"
            onChange={handleChangeFor('region')}
            name="region"
            required>
            <option value="">Bitte wählen</option>
            <Options>{REGIONS}</Options>
          </LabeledSelect>

          <Localized id="profile-form-gender-2" attrs={{ label: true }}>
            <LabeledSelect
              value={gender}
              onChange={handleChangeFor('gender')}
              name="gender"
              required>
              <option value="">Bitte wählen</option>
              <Options>{GENDERS}</Options>
            </LabeledSelect>
          </Localized>

          <LabeledInput
            name="age"
            type="number"
            label="Alter"
            min={MIN_AGE}
            max={MAX_AGE}
            value={age}
            onChange={handleChangeFor('age')}
            required
          />
        </div>

        <div className="signup-section">
          <div className="checkboxes">
            <LabeledCheckbox
              label={
                <>
                  <Localized id="email-opt-in-info-title">
                    <strong />
                  </Localized>
                  <Localized id="email-opt-in-info-sub-with-challenge">
                    <span />
                  </Localized>
                </>
              }
              onChange={handleChangeFor('sendEmails')}
              checked={sendEmails}
              name="email-opt-in"
            />
          </div>
        </div>

        <Hr />

        <Localized id="profile-form-submit-save">
          <Button className="save" rounded disabled={isSaving} type="submit" />
        </Localized>
      </form>
    </div>
  );
}

export default withLocalization(withRouter(ProfileInfo));
