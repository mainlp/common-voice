import * as React from 'react';
import ReactMarkdown from 'react-markdown';

import Page from '../../ui/page';
import PageHeading from '../../ui/page-heading';
import PageTextContent from '../../ui/page-text-content';
import privacy from './privacy.md';

const TermsPage = () => {
  return (
    <Page isCentered>
      <React.Fragment>
        <PageHeading>{'Datenschutz'}</PageHeading>
        <PageTextContent>
          <ReactMarkdown>{privacy}</ReactMarkdown>
        </PageTextContent>
      </React.Fragment>
    </Page>
  );
};

export default TermsPage;
