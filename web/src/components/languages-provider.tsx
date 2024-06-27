import * as React from 'react';
import { useEffect, useState } from 'react';
import { LocalizationProvider } from '@fluent/react';
import { useHistory, Switch, Route, Redirect } from 'react-router';
import { useDispatch } from 'react-redux';
import * as Sentry from '@sentry/react';

import URLS from '../urls';
import {
  createLocalization,
  DEFAULT_LOCALE,
  negotiateLocales,
} from '../services/localization';
import { useTypedSelector } from '../stores/tree';
import { replacePathLocale } from '../utility';
import { useAPI } from '../hooks/store-hooks';
import { Spinner } from './ui/ui';
import { Locale } from '../stores/locale';
import * as Languages from '../stores/languages';
import { useLocale } from './locale-helpers';

const SentryRoute = Sentry.withSentryRouting(Route);

interface LanguageRoutesProps {
  userLocales: string[];
  setUserLocales: (newUserLocales: string[]) => void;
  children: React.ReactNode;
}

const LanguageRoutes = ({
  userLocales,
  setUserLocales,
  children,
}: LanguageRoutesProps) => {
  const languages = useTypedSelector(({ languages }) => languages);
  const [primaryUserLocale] = userLocales;
  const [, toLocaleRoute] = useLocale();

  return (
    <Switch>
      {/* if there is no locale, redirect to url with locale */}
      <Route
        path="/login*"
        render={({ location }) => (
          <Redirect to={`/${primaryUserLocale}${location.pathname}`} />
        )}
      />
      {Object.values(URLS).map(url => (
        <SentryRoute
          key={url}
          exact
          path={url || '/'}
          render={() => (
            <Redirect to={`/${primaryUserLocale}${url}${location.search}`} />
          )}
        />
      ))}
      <SentryRoute
        path="/:locale"
        render={something => {
          const localeParam = something?.match?.params?.locale;

          const hasTranslatedLocale =
            languages.allLocales.includes(localeParam);
          if (hasTranslatedLocale) {
            if (primaryUserLocale !== localeParam) {
              setUserLocales([localeParam, ...userLocales]);
            }
            return children;
          }

          // TODO: Find the right place to do this redirect
          if (localeParam === 'sentence-collector') {
            return (
              <Redirect
                push
                to={toLocaleRoute(URLS.SENTENCE_COLLECTOR_REDIRECT)}
              />
            );
          }

          // 404 for non-translated locales
          return (
            <Redirect
              push
              to={{
                pathname: `/${primaryUserLocale}/404`,
                state: { prevPath: location.pathname },
              }}
            />
          );
        }}
      />
    </Switch>
  );
};

interface LanguagesProviderProps {
  children: React.ReactNode;
}

const LanguagesProvider = ({ children }: LanguagesProviderProps) => {
  const api = useAPI();
  const history = useHistory();
  const languages = useTypedSelector(({ languages }) => languages);
  const flags = useTypedSelector(({ flags }) => flags);
  const dispatch = useDispatch();

  const [userLocales, setUserLocales] = useState([]);
  const [localization, setLocalization] = useState(null);

  const loadLanguages = () => {
    dispatch(Languages.actions.loadLocalesData());
  };

  const setLocale = (newLocale: string) => {
    dispatch(Locale.actions.set(newLocale));
  };

  async function updateLocalization() {
    const localizationUserLocales = [...userLocales];

    const pathname = history.location.pathname;
    setLocale(localizationUserLocales[0]);

    const { documentElement } = document;
    documentElement.setAttribute('lang', localizationUserLocales[0]);
    documentElement.setAttribute(
      'dir',
      languages.rtlLocales.includes(localizationUserLocales[0]) ? 'rtl' : 'ltr'
    );

    const newLocalization = await createLocalization(
      api,
      localizationUserLocales,
      flags.messageOverwrites,
      languages.translatedLocales
    );

    setLocalization(newLocalization);
  }

  useEffect(() => {
    loadLanguages();
  }, []);

  useEffect(() => {
    if (userLocales.length === 0 && !languages?.isLoading) {
      const newUserLocales = negotiateLocales(
        navigator.languages,
        languages.translatedLocales
      );
      setUserLocales(newUserLocales);
    }
  }, [userLocales, languages]);

  useEffect(() => {
    if (userLocales.length > 0) {
      updateLocalization();
    }
  }, [userLocales]);

  if (languages?.isLoading || !localization) {
    return <Spinner />;
  }

  return (
    <LocalizationProvider l10n={localization}>
      <LanguageRoutes userLocales={userLocales} setUserLocales={setUserLocales}>
        {children}
      </LanguageRoutes>
    </LocalizationProvider>
  );
};

export default LanguagesProvider;
