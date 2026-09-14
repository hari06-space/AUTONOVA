import React from 'react';

export const withMuiIcon = (MuiComponent) => {
  return (props) => {
    return <MuiComponent {...props} style={{ fontSize: props.size || '20px', ...props.style }} />;
  };
};
