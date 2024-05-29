import * as React from 'react';
import URLS from '../../urls';

const Footer = React.memo(() => {
  return (
    <footer>
      <div className="tw-w-full tw-bg-darkAccent tw-mx-auto tw-justify-center tw-items-center tw-text-center">
        <div className="tw-text-whiteText tw-py-12 tw-px-4">
            Diese Website basiert auf dem <a href='https://commonvoice.mozilla.org/' target="_blank" className="hover:tw-underline tw-font-bold tw-text-whiteText">
              <span>Mozilla Common Voice</span></a> Projekt
        </div>
        <div className="tw-container tw-mx-auto tw-flex tw-flex-col tw-sm:flex-row tw-justify-center tw-items-center tw-py-4 tw-px-5 tw-text-whiteTextLight">
          <p className="sm:tw-text-left">
            <a className="tw-text-whiteTextLight hover:tw-underline tw-font-semibold" href={URLS.ABOUT}>Kontakt</a>{' '} | {' '}
            <a className="tw-text-whiteTextLight hover:tw-underline tw-font-semibold" href={URLS.TERMS}>Nutzungsbedingungen</a>{' '} | {' '}
            <a className="tw-text-whiteTextLight hover:tw-underline tw-font-semibold" href={URLS.PRIVACY}>Datenschutz</a>
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
