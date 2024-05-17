import React from 'react';
import {
  Title,
  PageSection,
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription
} from '@patternfly/react-core';
import packageJson from '../../package.json';

// https://philipwalton.github.io/solved-by-flexbox/demos/vertical-centering/
const centerStyle = {
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const IndexPage = () => {
  const prInfo = {
    num: process.env.prnum,
    url: process.env.prurl
  };

  const allDependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  return (
    <PageSection variant="light" style={centerStyle}>
      <div style={{ flex: 'none', textAlign: 'center' }}>
        <Title size="4xl" headingLevel="h1">
          PatternFly React Docs
        </Title>
        <Title size="2xl" headingLevel="h2">
          {prInfo.num ? <a href={prInfo.url}>PR #{prInfo.num}</a> : 'Hi people!'}
        </Title>
        <p>Welcome to Patternfly React docs.</p>
        <p>Now go build something great.</p>
        <hr />
        <div style={{ textAlign: 'start' }}>
          <p>You are currently running:</p>
          <DescriptionList isHorizontal isAutoFit>
            {Object.keys(allDependencies).map((key) => (
              <DescriptionListGroup key={key}>
                <DescriptionListTerm>{key}</DescriptionListTerm>
                <DescriptionListDescription>{allDependencies[key]}</DescriptionListDescription>
              </DescriptionListGroup>
            ))}
          </DescriptionList>
        </div>
      </div>
    </PageSection>
  );
};

export default IndexPage;
