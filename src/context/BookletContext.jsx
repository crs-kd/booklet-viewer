import { createContext, useContext, useReducer, useCallback } from 'react';

const BookletContext = createContext(null);

const PAGE_SIZES = {
  A5: { width: 148, height: 210, label: 'A5' },
  A4: { width: 210, height: 297, label: 'A4' },
  A3: { width: 297, height: 420, label: 'A3' },
  Square: { width: 210, height: 210, label: 'Square' },
};

const BINDING_TYPES = {
  ring: { label: 'Ring Bound' },
  perfect: { label: 'Perfect Bound' },
  chicago: { label: 'Chicago Screw' },
};

const initialState = {
  pages: [],
  pageSize: 'A4',
  binding: 'perfect',
  // currentSpread: which spread is showing. 0 = closed (cover only).
  // Spread 1 = pages[0] (left cover back) + pages[1] (right p2)
  // We track the right-page index (the first page of the right leaf)
  spreadIndex: 0, // 0 = closed, 1 = spread showing page 1+2, etc.
  isOpen: false,
  panelOpen: true,
};

let nextId = 1;

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_PAGES': {
      const newPages = action.payload.map((src) => ({
        id: nextId++,
        src,
        isTrace: false,
      }));
      return { ...state, pages: [...state.pages, ...newPages] };
    }
    case 'REMOVE_PAGE': {
      const pages = state.pages.filter((p) => p.id !== action.payload);
      return { ...state, pages };
    }
    case 'TOGGLE_TRACE': {
      const pages = state.pages.map((p) =>
        p.id === action.payload ? { ...p, isTrace: !p.isTrace } : p
      );
      return { ...state, pages };
    }
    case 'REORDER_PAGES': {
      return { ...state, pages: action.payload };
    }
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload };
    case 'SET_BINDING':
      return { ...state, binding: action.payload };
    case 'SET_SPREAD_INDEX':
      return { ...state, spreadIndex: action.payload };
    case 'OPEN_BOOK':
      return { ...state, isOpen: true, spreadIndex: 1 };
    case 'CLOSE_BOOK':
      return { ...state, isOpen: false, spreadIndex: 0 };
    case 'TOGGLE_PANEL':
      return { ...state, panelOpen: !state.panelOpen };
    default:
      return state;
  }
}

export function BookletProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addPages = useCallback((srcs) => dispatch({ type: 'ADD_PAGES', payload: srcs }), []);
  const removePage = useCallback((id) => dispatch({ type: 'REMOVE_PAGE', payload: id }), []);
  const toggleTrace = useCallback((id) => dispatch({ type: 'TOGGLE_TRACE', payload: id }), []);
  const reorderPages = useCallback((pages) => dispatch({ type: 'REORDER_PAGES', payload: pages }), []);
  const setPageSize = useCallback((size) => dispatch({ type: 'SET_PAGE_SIZE', payload: size }), []);
  const setBinding = useCallback((b) => dispatch({ type: 'SET_BINDING', payload: b }), []);
  const openBook = useCallback(() => dispatch({ type: 'OPEN_BOOK' }), []);
  const closeBook = useCallback(() => dispatch({ type: 'CLOSE_BOOK' }), []);
  const togglePanel = useCallback(() => dispatch({ type: 'TOGGLE_PANEL' }), []);

  const totalSpreads = Math.ceil(state.pages.length / 2);

  const goNext = useCallback(() => {
    if (!state.isOpen) {
      dispatch({ type: 'OPEN_BOOK' });
      return;
    }
    if (state.spreadIndex < totalSpreads) {
      dispatch({ type: 'SET_SPREAD_INDEX', payload: state.spreadIndex + 1 });
    }
  }, [state.isOpen, state.spreadIndex, totalSpreads]);

  const goPrev = useCallback(() => {
    if (state.spreadIndex <= 1) {
      dispatch({ type: 'CLOSE_BOOK' });
    } else {
      dispatch({ type: 'SET_SPREAD_INDEX', payload: state.spreadIndex - 1 });
    }
  }, [state.spreadIndex]);

  // For a given spreadIndex, return the left and right page objects (or null)
  // spreadIndex 1 = pages[0] left, pages[1] right
  // spreadIndex 2 = pages[2] left, pages[3] right, etc.
  const getCurrentPages = useCallback(() => {
    const leftIdx = (state.spreadIndex - 1) * 2;
    const rightIdx = leftIdx + 1;
    return {
      left: state.pages[leftIdx] ?? null,
      right: state.pages[rightIdx] ?? null,
      leftIndex: leftIdx,
      rightIndex: rightIdx,
    };
  }, [state.spreadIndex, state.pages]);

  const value = {
    ...state,
    PAGE_SIZES,
    BINDING_TYPES,
    totalSpreads,
    addPages,
    removePage,
    toggleTrace,
    reorderPages,
    setPageSize,
    setBinding,
    openBook,
    closeBook,
    togglePanel,
    goNext,
    goPrev,
    getCurrentPages,
  };

  return <BookletContext.Provider value={value}>{children}</BookletContext.Provider>;
}

export function useBooklet() {
  const ctx = useContext(BookletContext);
  if (!ctx) throw new Error('useBooklet must be used within BookletProvider');
  return ctx;
}
