import React, { createContext, useContext, useState } from 'react';

const SomeContext = createContext({});

export const useSomeContext = () => useContext(SomeContext);

export default function SomeProvider({ children }: any) {
  return children;
}
