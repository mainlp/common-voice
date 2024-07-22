import { Localized } from '@fluent/react';
import * as React from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router';
import { NavLink } from 'react-router-dom';
import * as Sentry from '@sentry/react';

import { User } from '../../../stores/user';
import StateTree from '../../../stores/tree';
import URLS from '../../../urls';
import { localeConnector, LocalePropsFromState } from '../../locale-helpers';
import { TrashIcon, UserIcon, CogIcon, UserPlusIcon } from '../../ui/icons';
import DeleteProfile from './delete/delete';
import InfoPage from './info/info';

import './layout.css';

const SentryRoute = Sentry.withSentryRouting(Route);

interface PropsFromState {
  user: User.State;
}

interface Props extends LocalePropsFromState, PropsFromState {}

const Layout = ({ toLocaleRoute, user }: Props) => {
  const [infoRoute, deleteRoute] = [URLS.PROFILE_INFO, URLS.PROFILE_DELETE].map(
    r => toLocaleRoute(r)
  );
  return (
    <div className="profile-layout">
      <div className="profile-nav">
        <div className="links">
          {[
            {
              route: infoRoute,
              ...(user.account
                ? { icon: <UserIcon />, id: 'profile' }
                : { icon: <UserPlusIcon />, id: 'build-profile' }),
            },
            {
              route: deleteRoute,
              icon: <TrashIcon />,
              id: 'profile-form-delete',
            },
          ]
            .slice(0, user.account ? Infinity : 1)
            .map(({ route, icon, id }) => (
              <NavLink key={route} to={route}>
                {icon}
                <Localized id={id}>
                  <span className="text" />
                </Localized>
              </NavLink>
            ))}
        </div>
      </div>
      <div className="content">
        <Switch>
          <SentryRoute exact path={infoRoute} component={InfoPage} />
          {[{ route: deleteRoute, Component: DeleteProfile }].map(
            ({ route, Component }) => (
              <SentryRoute
                key={route}
                exact
                path={route}
                render={props =>
                  user.account ? <Component /> : <Redirect to={infoRoute} />
                }
              />
            )
          )}
          <SentryRoute
            render={() => <Redirect to={toLocaleRoute(URLS.PROFILE_INFO)} />}
          />
        </Switch>
      </div>
    </div>
  );
};

export default connect<PropsFromState>(({ user }: StateTree) => ({ user }))(
  localeConnector(Layout)
);
