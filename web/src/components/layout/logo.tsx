import * as React from 'react';
import { LocaleLink } from '../locale-helpers';

const Logo = () => {
  return (
    <LocaleLink
      className="Logo tw-bg-gradient-to-r tw-from-primary-700 tw-to-primary-400 tw-text-transparent tw-inline-block tw-bg-clip-text 
      tw-capitalize tw-text-2xl tw-font-extrabold sm:text-md hover:tw-drop-shadow-md"
      to="">
      <p>Bavarian</p>
      <p>Voice</p>
    </LocaleLink>
  );
};

export default Logo;
