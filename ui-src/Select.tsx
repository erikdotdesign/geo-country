import React from 'react';
import Control, { ControlProps } from './Control';

const Select = ({
  children,
  ...props
}: ControlProps) => {
  return (
    <Control
      {...props}
      as="select"
      right={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>}
      rightReadOnly={true}>
      { children }
    </Control>
  )
}

export default Select;