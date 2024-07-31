import { Localized } from '@fluent/react';
import React, { useState } from 'react';
import Modal from '../modal/modal';
import { Button, LabeledInput, LabeledSelect, Options } from '../ui/ui';
import {
  REGIONS,
  GENDERS,
  MIN_AGE,
  MAX_AGE,
  Metadata,
} from '../../stores/demographics';

interface Props {
  onRequestClose: () => void;
  onSubmit: (metadata: Metadata) => void;
}

export default function MetadataModal({ onRequestClose, onSubmit }: Props) {
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const metadata: Metadata = {
      gender,
      age: age === '' ? '' : parseInt(age, 10),
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
        <LabeledInput
          name="age"
          type="number"
          min={MIN_AGE}
          max={MAX_AGE}
          value={age}
          onChange={(event: any) => setAge(event.target.value)}
          required
        />

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
