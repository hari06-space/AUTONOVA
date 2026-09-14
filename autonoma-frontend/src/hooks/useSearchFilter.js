import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';

/**
 * Hook to register page-specific filters in the global search bar.
 * @param {Array} config - Array of filter field configurations.
 */
const useSearchFilter = (config) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (config) {
      dispatch(setFilterConfig(config));
    }

    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [config, dispatch]);
};

export default useSearchFilter;
