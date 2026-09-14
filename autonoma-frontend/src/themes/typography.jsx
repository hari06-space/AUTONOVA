export default function Typography(fontFamily, baseFontSize = 14, isBold = false, isItalic = false) {
  // Base is 14px. We calculate ratio from the requested baseFontSize.
  const calc = (px) => `${(px / 14) * baseFontSize}px`;

  const getWeight = (defaultWeight) => (isBold ? Math.min(defaultWeight + 300, 900) : defaultWeight);
  const baseStyle = isItalic ? { fontStyle: 'italic' } : {};

  return {
    fontFamily,
    fontSize: baseFontSize,
    ...(isItalic && { fontStyle: 'italic' }),
    h6: {
      fontWeight: getWeight(500),
      fontSize: calc(12), // 0.75rem
      ...baseStyle
    },
    h5: {
      fontSize: calc(14), // 0.875rem
      fontWeight: getWeight(500),
      ...baseStyle
    },
    h4: {
      fontSize: calc(16), // 1rem
      fontWeight: getWeight(600),
      ...baseStyle
    },
    h3: {
      fontSize: calc(20), // 1.25rem
      fontWeight: getWeight(600),
      ...baseStyle
    },
    h2: {
      fontSize: calc(24), // 1.5rem
      fontWeight: getWeight(700),
      ...baseStyle
    },
    h1: {
      fontSize: calc(34), // 2.125rem
      fontWeight: getWeight(700),
      ...baseStyle
    },
    subtitle1: {
      fontSize: calc(14), // 0.875rem
      fontWeight: getWeight(500),
      ...baseStyle
    },
    subtitle2: {
      fontSize: calc(12), // 0.75rem
      fontWeight: getWeight(400),
      ...baseStyle
    },
    caption: {
      fontSize: calc(12), // 0.75rem
      fontWeight: getWeight(400),
      ...baseStyle
    },
    body1: {
      fontSize: calc(14), // 0.875rem
      fontWeight: getWeight(400),
      lineHeight: '1.334em',
      ...baseStyle
    },
    body2: {
      fontSize: calc(14),
      letterSpacing: '0em',
      fontWeight: getWeight(400),
      lineHeight: '1.5em',
      ...baseStyle
    },
    button: {
      textTransform: 'capitalize',
      fontSize: calc(14),
      ...baseStyle
    },
    commonAvatar: {
      cursor: 'pointer',
      borderRadius: '8px'
    },
    smallAvatar: {
      width: '22px',
      height: '22px',
      fontSize: calc(16) // 1rem
    },
    mediumAvatar: {
      width: '34px',
      height: '34px',
      fontSize: calc(19.2) // 1.2rem
    },
    largeAvatar: {
      width: '44px',
      height: '44px',
      fontSize: calc(24) // 1.5rem
    }
  };
}
