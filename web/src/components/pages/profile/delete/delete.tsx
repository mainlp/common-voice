import React, { useState, useRef } from 'react';
import { connect } from 'react-redux';
import {
  Localized,
  withLocalization,
  WithLocalizationProps,
} from '@fluent/react';
import { User } from '../../../../stores/user';
import StateTree from '../../../../stores/tree';
import { Notifications } from '../../../../stores/notifications';
import { useAction, useAPI } from '../../../../hooks/store-hooks';
import { Toggle, Hr, Button } from '../../../ui/ui';
import { signOut } from 'supertokens-auth-react/recipe/session';
import { useDispatch } from 'react-redux';

import './delete.css';

interface PropsFromState {
  user: User.State;
}

interface Props extends WithLocalizationProps, PropsFromState {}

const DeleteProfile: React.FC<Props> = props => {
  const [keep, setKeep] = useState(true);
  const api = useAPI();
  const dispatch = useDispatch();
  const textareaRef = useRef(null);
  const addNotification = useAction(Notifications.actions.addPill);

  const deleteUser = async (keepRecordings: boolean) => {
    if (!props.user.account.email) {
      addNotification('Problem beim Löschen des Accounts');
      throw new Error('Email adress not found');
    }
    api.deleteAccount(props.user.account.email, keepRecordings);
    await dispatch(User.actions.reset);
    await signOut();
    // redirect to landing page
    window.location.href = '/';
    location.reload();
  };

  return (
    <div className="profile-delete">
      <div className="top">
        <h2>
          <Localized id="delete-q">
            <span />
          </Localized>
        </h2>
      </div>
      <div className="toggle-with-info">
        <div className="toggle-container">
          <Toggle
            onText="keep"
            offText="remove"
            defaultChecked={keep}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setKeep(event.target.checked);
            }}
          />
        </div>
      </div>
      {/* We're disabling this field for now */}
      {false && !keep && (
        <textarea
          placeholder={props.getString('why-delete-recordings')}
          ref={textareaRef}
        />
      )}
      <Hr />
      <Localized id="profile-form-delete">
        <Button rounded onClick={() => deleteUser(keep)} />
      </Localized>
    </div>
  );
};

export default connect<PropsFromState>(({ user }: StateTree) => ({ user }))(
  withLocalization(DeleteProfile)
);
