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
  orientation: 'portrait', // 'portrait' | 'landscape'
  binding: 'perfect',
  spreadIndex: 0, // 0 = closed, 1+ = open spread
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
    case 'REMOVE_PAGE':
      return { ...state, pages: state.pages.filter((p) => p.id !== action.payload) };
    case 'TOGGLE_TRACE':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.payload ? { ...p, isTrace: !p.isTrace } : p
        ),
      };
    case 'REORDER_PAGES':
      return { ...state, pages: action.payload };
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload };
    case 'SET_ORIENTATION':
      return { ...state, orientation: action.payload };
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
  const reorderPages = useCallback((p) => dispatch({ type: 'REORDER_PAGES', payload: p }), []);
  const setPageSize = useCallback((s) => dispatch({ type: 'SET_PAGE_SIZE', payload: s }), []);
  const setOrientation = useCallback((o) => dispatch({ type: 'SET_ORIENTATION', payload: o }), []);
  const setBinding = useCallback((b) => dispatch({ type: 'SET_BINDING', payload: b }), []);
  const openBook = useCallback(() => dispatch({ type: 'OPEN_BOOK' }), []);
  const closeBook = useCallback(() => dispatch({ type: 'CLOSE_BOOK' }), []);
  const togglePanel = useCallback(() => dispatch({ type: 'TOGGLE_PANEL' }), []);

  // Page layout:
  //   Closed view  → shows pages[0] as cover
  //   Spread 1     → left: null (inside front cover / blank), right: pages[0]
  //   Spread 2     → left: pages[1], right: pages[2]
  //   Spread N     → left: pages[(N-1)*2 - 1], right: pages[(N-1)*2]
  //
  // This means pages[0] is used as the cover AND the first visible inner page (right of spread 1).
  // This mirrors a real booklet where the front cover IS page 1.
  //
  // Total spreads = ceil((n+1)/2) for n pages, 0 for no pages.
  const totalSpreads =
    state.pages.length === 0 ? 0 : Math.ceil((state.pages.length + 1) / 2);

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

  // Returns the page objects and raw indices for the current spread.
  // rightIdx = (spreadIndex - 1) * 2  → pages[rightIdx]
  // leftIdx  = rightIdx - 1           → pages[leftIdx] (null if spread 1)
  // pageBelowLeft / pageBelowRight: the next page in the physical stack (index + 2).
  const getCurrentPages = useCallback(() => {
    const rightIdx = (state.spreadIndex - 1) * 2;
    const leftIdx = rightIdx - 1;
    return {
      left: leftIdx >= 0 ? (state.pages[leftIdx] ?? null) : null,
      right: state.pages[rightIdx] ?? null,
      leftIndex: leftIdx,
      rightIndex: rightIdx,
      // Each page's physical neighbour beneath it in the stack is 2 indices further
      pageBelowLeft: leftIdx >= 0 ? (state.pages[leftIdx + 2] ?? null) : null,
      pageBelowRight: state.pages[rightIdx + 2] ?? null,
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
    setOrientation,
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
