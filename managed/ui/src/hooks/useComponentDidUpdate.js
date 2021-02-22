import React, {useEffect, useRef} from 'react';

export const useComponentDidUpdate = (effect, dependencies) => {
  const hasMounted = useRef(false);

  useEffect(
    () => {
      if (!hasMounted.current) {
        hasMounted.current = true;
        return;
      }
      effect();
    },
    [effect, ...dependencies]
  );
};
