import { Localized } from '@fluent/react';
import React, { useState } from 'react';
import Modal from '../modal/modal';
import {
  Button,
  LabeledCheckbox,
  LabeledInput,
  LabeledSelect,
  Options,
} from '../ui/ui';
import {
  AGE_GROUPS,
  REGIONS,
  GENDERS,
  MIN_AGE,
  MAX_AGE,
  Metadata,
} from '../../stores/demographics';

interface Props {
  onRequestClose: () => void;
  onSubmit: (metadata: Metadata) => void;
  initGender: string;
  initAge: string;
  initRegion: string;
}

export default function MetadataModal({
  onRequestClose,
  onSubmit,
  initGender,
  initAge,
  initRegion,
}: Props) {
  const [gender, setGender] = useState(initGender);
  const [age, setAge] = useState(initAge);
  const [region, setRegion] = useState(initRegion);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const metadata: Metadata = {
      gender,
      age,
      region,
    };
    onSubmit(metadata);
    onRequestClose();
  };

  return (
    <Modal innerClassName="contact-modal" onRequestClose={onRequestClose}>
      <form onSubmit={handleSubmit}>
        <div className="title-and-action tw-pb-4">
          <h1>Metadaten Abfrage</h1>
        </div>
        <Localized id="why-profile-text">
          <p />
        </Localized>

        {/* Age section */}
        <h3 className="tw-py-2">Alter</h3>
        <LabeledSelect
          value={age}
          onChange={(event: any) => setAge(event.target.value)}
          required>
          <option value="">Bitte wählen</option>
          <Options>{AGE_GROUPS}</Options>
        </LabeledSelect>

        {/* Gender section */}
        <h3 className="tw-pb-2">Geschlecht</h3>
        <LabeledSelect
          value={gender}
          onChange={(event: any) => setGender(event.target.value)}
          required>
          <option value="">Bitte wählen</option>
          <Options>{GENDERS}</Options>
        </LabeledSelect>

        {/* Region section */}
        <div className="tw-py-2">
          <h3 className="tw-pb-2">Region</h3>
          <LabeledSelect
            value={region}
            onChange={(event: any) => setRegion(event.target.value)}
            required>
            <option value="">Bitte wählen</option>
            <Options>{REGIONS}</Options>
          </LabeledSelect>
        </div>

        <LabeledCheckbox
          required
          label={
            <>
              Ich stimme den{' '}
              <a href="/terms" target="_blank">
                Nutzungsbedingungen
              </a>{' '}
              zu.
            </>
          }></LabeledCheckbox>

        {/* Submit button */}
        <Button className="submit tw-mt-4" type="submit">
          <Localized id="submit-form-action">
            <span>Submit</span>
          </Localized>
        </Button>
      </form>
    </Modal>
  );
}
