import * as React from 'react';
import { render } from '@testing-library/react';
import { TEXT } from '../../../helpers/constants/design-system';
import { Text } from '.';

describe('Text', () => {
  it('should render the Text without crashing', () => {
    const { getByText } = render(<Text>Test type</Text>);
    expect(getByText('Test type')).toBeDefined();
  });
  it('should render the Text with correct html elements', () => {
    const { getByText, container } = render(
      <>
        <Text as="p">p</Text>
        <Text as="h1">h1</Text>
        <Text as="h2">h2</Text>
        <Text as="h3">h3</Text>
        <Text as="h4">h4</Text>
        <Text as="h5">h5</Text>
        <Text as="h6">h6</Text>
        <Text as="span">span</Text>
        <Text as="strong">strong</Text>
        <Text as="em">em</Text>
        <Text as="li">li</Text>
        <Text as="div">div</Text>
        <Text as="dt">dt</Text>
        <Text as="dd">dd</Text>
      </>,
    );
    expect(container.querySelector('p')).toBeDefined();
    expect(getByText('p')).toBeDefined();
    expect(container.querySelector('h1')).toBeDefined();
    expect(getByText('h1')).toBeDefined();
    expect(container.querySelector('h2')).toBeDefined();
    expect(getByText('h2')).toBeDefined();
    expect(container.querySelector('h3')).toBeDefined();
    expect(getByText('h3')).toBeDefined();
    expect(container.querySelector('h4')).toBeDefined();
    expect(getByText('h4')).toBeDefined();
    expect(container.querySelector('h5')).toBeDefined();
    expect(getByText('h5')).toBeDefined();
    expect(container.querySelector('h6')).toBeDefined();
    expect(getByText('h6')).toBeDefined();
    expect(container.querySelector('span')).toBeDefined();
    expect(getByText('span')).toBeDefined();
    expect(container.querySelector('strong')).toBeDefined();
    expect(getByText('strong')).toBeDefined();
    expect(container.querySelector('em')).toBeDefined();
    expect(getByText('em')).toBeDefined();
    expect(container.querySelector('li')).toBeDefined();
    expect(getByText('li')).toBeDefined();
    expect(container.querySelector('div')).toBeDefined();
    expect(getByText('div')).toBeDefined();
    expect(container.querySelector('dt')).toBeDefined();
    expect(getByText('dt')).toBeDefined();
    expect(container.querySelector('dd')).toBeDefined();
    expect(getByText('dd')).toBeDefined();
  });

  it('should render the Text with proper variant classname', () => {
    const { container } = render(
      <>
        <Text variant={TEXT.DISPLAY_MD}>{TEXT.DISPLAY_MD}</Text>
        <Text variant={TEXT.HEADING_LG}>{TEXT.HEADING_LG}</Text>
        <Text variant={TEXT.HEADING_MD}>{TEXT.HEADING_MD}</Text>
        <Text variant={TEXT.HEADING_SM}>{TEXT.HEADING_SM}</Text>
        <Text variant={TEXT.BODY_LG}>{TEXT.BODY_LG}</Text>
        <Text variant={TEXT.BODY_MD}>{TEXT.BODY_MD}</Text>
        <Text variant={TEXT.BODY_SM}>{TEXT.BODY_SM}</Text>
        <Text variant={TEXT.BODY_XS}>{TEXT.BODY_XS}</Text>
      </>,
    );
    expect(
      container.getElementsByClassName('text--display-md')[0],
    ).toBeDefined();
    expect(
      container.getElementsByClassName('text--heading-lg')[0],
    ).toBeDefined();
    expect(
      container.getElementsByClassName('text--heading-md')[0],
    ).toBeDefined();
    expect(
      container.getElementsByClassName('text--heading-sm')[0],
    ).toBeDefined();
    expect(
      container.getElementsByClassName('text--body-lg-medium')[0],
    ).toBeDefined();
    expect(container.getElementsByClassName('text--body-md')[0]).toBeDefined();
    expect(container.getElementsByClassName('text--body-sm')[0]).toBeDefined();
    expect(container.getElementsByClassName('text--body-xs')[0]).toBeDefined();
  });
});
