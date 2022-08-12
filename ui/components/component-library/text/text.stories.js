import React from 'react';
import {
  COLORS,
  DISPLAY,
  BACKGROUND_COLORS,
  BORDER_COLORS,
  FONT_WEIGHT,
  FONT_STYLE,
  TEXT_COLORS,
  TEXT_ALIGN,
  TEXT,
  OVERFLOW_WRAP,
  SIZES,
} from '../../../helpers/constants/design-system';

import { ValidTags, Text } from './text';

import README from './README.mdx';

const sizeKnobOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const marginSizeKnobOptions = [...sizeKnobOptions, 'auto'];

export default {
  title: 'Components/ComponentLibrary/Text',
  id: __filename,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: Object.values(TEXT),
    },
    color: {
      control: { type: 'select' },
      options: Object.values(TEXT_COLORS),
    },
    fontWeight: {
      control: { type: 'select' },
      options: Object.values(FONT_WEIGHT),
    },
    fontStyle: {
      control: { type: 'select' },
      options: Object.values(FONT_STYLE),
    },
    align: {
      control: { type: 'select' },
      options: Object.values(TEXT_ALIGN),
    },
    overflowWrap: {
      control: { type: 'select' },
      options: Object.values(OVERFLOW_WRAP),
    },
    ellipsis: {
      control: { type: 'boolean' },
    },
    as: {
      control: { type: 'select' },
      options: ValidTags,
    },
    className: {
      control: { type: 'text' },
    },
    children: {
      control: { type: 'text' },
    },
    display: {
      options: Object.values(DISPLAY),
      control: 'select',
      table: { category: 'box props' },
    },
    backgroundColor: {
      options: Object.values(BACKGROUND_COLORS),
      control: 'select',
      table: { category: 'box props' },
    },
    borderColor: {
      options: Object.values(BORDER_COLORS),
      control: 'select',
      table: { category: 'box props' },
    },
    padding: {
      options: sizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    margin: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginTop: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginRight: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginBottom: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginLeft: {
      options: marginSizeKnobOptions,
      control: 'select',
      table: { category: 'box props' },
    },
  },
};

function renderBackgroundColor(color) {
  let bgColor;
  switch (color) {
    case COLORS.OVERLAY_INVERSE:
      bgColor = COLORS.OVERLAY_DEFAULT;
      break;
    case COLORS.PRIMARY_INVERSE:
      bgColor = COLORS.PRIMARY_DEFAULT;
      break;
    case COLORS.SECONDARY_INVERSE:
      bgColor = COLORS.SECONDARY_DEFAULT;
      break;
    case COLORS.ERROR_INVERSE:
      bgColor = COLORS.ERROR_DEFAULT;
      break;
    case COLORS.WARNING_INVERSE:
      bgColor = COLORS.WARNING_DEFAULT;
      break;
    case COLORS.SUCCESS_INVERSE:
      bgColor = COLORS.SUCCESS_DEFAULT;
      break;
    case COLORS.INFO_INVERSE:
      bgColor = COLORS.INFO_DEFAULT;
      break;
    default:
      bgColor = null;
      break;
  }

  return bgColor;
}

export const DefaultStory = (args) => (
  <Text backgroundColor={renderBackgroundColor(args.color)} {...args}>
    {args.children}
  </Text>
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  children: 'The quick orange fox jumped over the lazy dog.',
};

export const Variant = (args) => (
  <>
    {Object.values(TEXT).map((variant) => (
      <Text
        backgroundColor={renderBackgroundColor(args.color)}
        {...args}
        variant={variant}
        key={variant}
      >
        {args.children || variant}
      </Text>
    ))}
  </>
);

export const Color = (args) => {
  // Index of last valid color in TEXT_COLORS array
  const LAST_VALID_COLORS_ARRAY_INDEX = 16;
  return (
    <>
      {Object.values(TEXT_COLORS).map((color, index) => {
        if (index === LAST_VALID_COLORS_ARRAY_INDEX) {
          return (
            <React.Fragment key={color}>
              <Text
                color={TEXT_COLORS.TEXT_DEFAULT}
                align={TEXT_ALIGN.CENTER}
                backgroundColor={BACKGROUND_COLORS.WARNING_MUTED}
                padding={4}
                borderColor={BORDER_COLORS.WARNING_DEFAULT}
              >
                DEPRECATED COLORS - DO NOT USE
              </Text>
              <Text
                {...args}
                backgroundColor={renderBackgroundColor(color)}
                color={color}
              >
                <strike>{color}</strike>
              </Text>
            </React.Fragment>
          );
        } else if (index >= LAST_VALID_COLORS_ARRAY_INDEX) {
          return (
            <Text
              {...args}
              backgroundColor={renderBackgroundColor(color)}
              color={color}
              key={color}
            >
              <strike>{color}</strike>
            </Text>
          );
        }
        return (
          <Text
            {...args}
            backgroundColor={renderBackgroundColor(color)}
            color={color}
            key={color}
          >
            {color}
          </Text>
        );
      })}
    </>
  );
};

export const FontWeight = (args) => (
  <>
    {Object.values(FONT_WEIGHT).map((weight) => (
      <Text {...args} fontWeight={weight} key={weight}>
        {weight}
      </Text>
    ))}
  </>
);

export const FontStyle = (args) => (
  <>
    {Object.values(FONT_STYLE).map((style) => (
      <Text {...args} fontStyle={style} key={style}>
        {style}
      </Text>
    ))}
  </>
);

export const Align = (args) => (
  <>
    {Object.values(TEXT_ALIGN).map((align) => (
      <Text {...args} align={align} key={align}>
        {align}
      </Text>
    ))}
  </>
);

export const OverflowWrap = (args) => (
  <div
    style={{
      width: 250,
      border: '1px solid var(--color-error-default)',
      display: 'block',
    }}
  >
    <Text {...args} overflowWrap={OVERFLOW_WRAP.NORMAL}>
      {OVERFLOW_WRAP.NORMAL}: 0x39013f961c378f02c2b82a6e1d31e9812786fd9d
    </Text>
    <Text {...args} overflowWrap={OVERFLOW_WRAP.BREAK_WORD}>
      {OVERFLOW_WRAP.BREAK_WORD}: 0x39013f961c378f02c2b82a6e1d31e9812786fd9d
    </Text>
  </div>
);

export const Ellipsis = (args) => (
  <div
    style={{
      width: 250,
      border: '1px solid var(--color-primary-default)',
      display: 'block',
    }}
  >
    <Text {...args} ellipsis>
      Ellipsis: 0x39013f961c378f02c2b82a6e1d31e9812786fd9d
    </Text>
    <Text {...args}>
      No Ellipsis: 0x39013f961c378f02c2b82a6e1d31e9812786fd9d
    </Text>
  </div>
);

export const As = (args) => (
  <>
    {Object.values(ValidTags).map((tag) => (
      <div key={tag}>
        <Text {...args} as={tag}>
          {tag}
        </Text>
      </div>
    ))}
  </>
);

export const BoxProps = (args) => (
  <Text {...args}>This uses the boxProps prop</Text>
);

BoxProps.args = {
  color: COLORS.TEXT_DEFAULT,
  backgroundColor: BACKGROUND_COLORS.BACKGROUND_ALTERNATIVE,
  borderColor: BORDER_COLORS.ERROR_ALTERNATIVE,
  padding: 1,
  margin: 2,
  borderRadius: SIZES.SM,
};
