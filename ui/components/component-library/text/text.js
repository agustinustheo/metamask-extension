import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {
  COLORS,
  FONT_WEIGHT,
  FONT_STYLE,
  TEXT_ALIGN,
  TEXT,
  OVERFLOW_WRAP,
} from '../../../helpers/constants/design-system';
import Box, { MultipleSizesAndAuto } from '../../ui/box';

export const ValidColors = [
  COLORS.TEXT_DEFAULT,
  COLORS.TEXT_ALTERNATIVE,
  COLORS.TEXT_MUTED,
  COLORS.OVERLAY_INVERSE,
  COLORS.PRIMARY_DEFAULT,
  COLORS.PRIMARY_INVERSE,
  COLORS.SECONDARY_DEFAULT,
  COLORS.SECONDARY_INVERSE,
  COLORS.ERROR_DEFAULT,
  COLORS.ERROR_INVERSE,
  COLORS.SUCCESS_DEFAULT,
  COLORS.SUCCESS_INVERSE,
  COLORS.WARNING_INVERSE,
  COLORS.INFO_DEFAULT,
  COLORS.INFO_INVERSE,
];

export const ValidTags = [
  'dd',
  'div',
  'dt',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'p',
  'span',
  'strong',
  'ul',
  'label',
];

export const Text = ({
  variant = TEXT.BODY_MD,
  color = COLORS.TEXT_DEFAULT,
  fontWeight,
  fontStyle,
  align,
  overflowWrap,
  ellipsis,
  as,
  margin,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  className,
  children,
  ...props
}) => {
  let Tag = as ?? variant;
  let strongTagFontWeight;

  if (Tag === 'strong') {
    strongTagFontWeight = FONT_WEIGHT.BOLD;
  }

  const computedClassName = classnames(
    'text',
    className,
    `text--${variant}`,

    (strongTagFontWeight || fontWeight) &&
      `text--weight-${strongTagFontWeight || fontWeight}`,
    fontStyle && `text--style-${fontStyle}`,
    { [`text--ellipsis`]: Boolean(ellipsis) },
    {
      [`text--align-${align}`]: Boolean(align),
      [`text--color-${color}`]: Boolean(color),
      [`text--overflowwrap-${overflowWrap}`]: Boolean(overflowWrap),
    },
  );

  // // Set a default tag based on variant
  const splitTag = Tag.split('-')[0];
  if (splitTag === 'body') {
    Tag = 'p';
  } else if (splitTag === 'heading') {
    Tag = 'h2';
  } else if (splitTag === 'display') {
    Tag = 'h1';
  }

  return (
    <Box
      {...{
        margin,
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        ...props,
      }}
      className={classnames(computedClassName)}
      as={Tag}
    >
      {children}
    </Box>
  );
};

Text.propTypes = {
  /**
   * The variation of font styles including sizes and weights of the Text component (display, heading, body)
   */
  variant: PropTypes.oneOf(Object.values(TEXT)),
  /**
   * The color of the Text component Should use the COLOR object from
   * ./ui/helpers/constants/design-system.js
   */
  color: PropTypes.oneOf(ValidColors),
  /**
   * The font-weight of the Text component. Should use the FONT_WEIGHT object from
   * ./ui/helpers/constants/design-system.js
   */
  fontWeight: PropTypes.oneOf(Object.values(FONT_WEIGHT)),
  /**
   * The font-style of the Text component. Should use the FONT_STYLE object from
   * ./ui/helpers/constants/design-system.js
   */
  fontStyle: PropTypes.oneOf(Object.values(FONT_STYLE)),
  /**
   * The text-align of the Text component. Should use the TEXT_ALIGN object from
   * ./ui/helpers/constants/design-system.js
   */
  align: PropTypes.oneOf(Object.values(TEXT_ALIGN)),
  /**
   * The overflow-wrap of the Text component. Should use the OVERFLOW_WRAP object from
   * ./ui/helpers/constants/design-system.js
   */
  overflowWrap: PropTypes.oneOf(Object.values(OVERFLOW_WRAP)),
  /**
   * Used for long strings that can be cut off...
   */
  ellipsis: PropTypes.bool,
  /**
   * Changes the root html element tag of the Text component.
   */
  as: PropTypes.oneOf(ValidTags),
  /**
   * Adds margin to the Text component should use valid size
   * you can also use any box props (padding, backgroundColor, etc)
   */
  margin: MultipleSizesAndAuto,
  marginTop: MultipleSizesAndAuto,
  marginBottom: MultipleSizesAndAuto,
  marginRight: MultipleSizesAndAuto,
  marginLeft: MultipleSizesAndAuto,
  /**
   * Additional className to assign the Text component
   */
  className: PropTypes.string,
  /**
   * Title attribute to include on the element. Will show as tooltip on hover.
   */
  title: PropTypes.string,
  /**
   * The text content of the Text component
   */
  children: PropTypes.node.isRequired,
};

export default Text;
