import { Localized } from '@fluent/react';
import React, { useState } from 'react';
import Modal from '../modal/modal';
import { Button, LabeledInput } from '../ui/ui';

interface Props {
  onRequestClose: () => void;
  onSubmit: (metadata: Metadata) => void;
}

export interface Metadata {
  gender: string;
  age: number;
  location: string;
}

const GENDERS = {
  MALE: 'm',
  FEMALE: 'w',
  DIVERSE: 'd',
};

const REGIONS = {
  REGION_1: 'Region 1',
  REGION_2: 'Region 2',
  REGION_3: 'Region 3',
};

const MIN_AGE = 18;
const MAX_AGE = 99;

export default function MetadataModal({ onRequestClose, onSubmit }: Props) {
  const [gender, setGender] = useState('');
  const [age, setAge] = useState(18);
  const [location, setLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const metadata: Metadata = {
      gender,
      age,
      location,
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
        <div className="tw-pb-4">
          Mit Ihren Angaben helfen Sie uns ... . Alle Angaben sind freiwillig.
        </div>

        {/* Age section */}
        <Localized id="dataset-metadata-age">
          <h3 className="tw-pb-1" />
        </Localized>

        <LabeledInput
          name="age"
          type="number"
          min={MIN_AGE}
          max={MAX_AGE}
          value={age}
          onChange={(e: any) => setAge(e.target.value)}
          required
        />

        {/* Gender section */}
        <div className="tw-py-2">
          <Localized id="dataset-metadata-sex">
            <h3 className="tw-pb-1" />
          </Localized>

          <div className="tw-flex tw-items-center">
            <input
              id="m-radio"
              type="radio"
              value={GENDERS.MALE}
              name="gender-radio"
              className="tw-w-4 tw-h-4 tw-text-primary-600 tw-bg-gray-100 tw-border-gray-300 focus:tw-ring-primary-500"
              checked={gender === GENDERS.MALE}
              onChange={() => setGender(GENDERS.MALE)}
              required
            />
            <label
              htmlFor="m-radio"
              className="tw-ms-2 tw-text-sm tw-font-medium tw-text-gray-900">
              {GENDERS.MALE}
            </label>
          </div>
          <div className="tw-flex tw-items-center">
            <input
              id="w-radio"
              type="radio"
              value={GENDERS.FEMALE}
              name="gender-radio"
              className="tw-w-4 tw-h-4 tw-text-primary-600 tw-bg-gray-100 tw-border-gray-300 focus:tw-ring-primary-500"
              checked={gender === GENDERS.FEMALE}
              onChange={() => setGender(GENDERS.FEMALE)}
              required
            />
            <label
              htmlFor="w-radio"
              className="tw-ms-2 tw-text-sm tw-font-medium tw-text-gray-900">
              {GENDERS.FEMALE}
            </label>
          </div>
          <div className="tw-flex tw-items-center">
            <input
              id="d-radio"
              type="radio"
              value={GENDERS.DIVERSE}
              name="gender-radio"
              className="tw-w-4 tw-h-4 tw-text-primary-600 tw-bg-gray-100 tw-border-gray-300 focus:tw-ring-primary-500"
              checked={gender === GENDERS.DIVERSE}
              onChange={() => setGender(GENDERS.DIVERSE)}
              required
            />
            <label
              htmlFor="d-radio"
              className="tw-ms-2 tw-text-sm tw-font-medium tw-text-gray-900">
              {GENDERS.DIVERSE}
            </label>
          </div>
        </div>

        {/* Location section */}
        <div className="tw-py-2">
          <h3 className="tw-pb-1">Region</h3>
          <div className="tw-flex tw-items-center">
            <input
              id="region1-radio"
              type="radio"
              value={REGIONS.REGION_1}
              name="location-radio"
              className="tw-w-4 tw-h-4 tw-text-primary-600 tw-bg-gray-100 tw-border-gray-300 focus:tw-ring-primary-500"
              checked={location === REGIONS.REGION_1}
              onChange={() => setLocation(REGIONS.REGION_1)}
              required
            />
            <label
              htmlFor="region1-radio"
              className="tw-ms-2 tw-text-sm tw-font-medium tw-text-gray-900">
              {REGIONS.REGION_1}
            </label>
          </div>
          <div className="tw-flex tw-items-center">
            <input
              id="region2-radio"
              type="radio"
              value={REGIONS.REGION_2}
              name="location-radio"
              className="tw-w-4 tw-h-4 tw-text-primary-600 tw-bg-gray-100 tw-border-gray-300 focus:tw-ring-primary-500"
              checked={location === REGIONS.REGION_2}
              onChange={() => setLocation(REGIONS.REGION_2)}
              required
            />
            <label
              htmlFor="region2-radio"
              className="tw-ms-2 tw-text-sm tw-font-medium tw-text-gray-900">
              {REGIONS.REGION_2}
            </label>
          </div>
          <div className="tw-flex tw-items-center">
            <input
              id="region3-radio"
              type="radio"
              value={REGIONS.REGION_3}
              name="location-radio"
              className="tw-w-4 tw-h-4 tw-text-primary-600 tw-bg-gray-100 tw-border-gray-300 focus:tw-ring-primary-500"
              checked={location === REGIONS.REGION_3}
              onChange={() => setLocation(REGIONS.REGION_3)}
              required
            />
            <label
              htmlFor="region3-radio"
              className="tw-ms-2 tw-text-sm tw-font-medium tw-text-gray-900">
              {REGIONS.REGION_3}
            </label>
          </div>
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
