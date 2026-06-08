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
  //   pages[0]  = front cover — shown only in the closed state.
  //   Spread 1  → left: null (blank inside-front-cover), right: pages[1]
  //   Spread 2  → left: pages[2],  right: pages[3]
  //   Spread N  → left: pages[N*2-2], right: pages[N*2-1]   (left null for N=1)
  //
  // rightIdx(N) = N*2 - 1    (1, 3, 5, …)
  // leftIdx(N)  = N*2 - 2    (0, 2, 4, …) — but spread 1's left is always null (inside cover)
  //
  // totalSpreads: n=0 or 1 → 0 (cover only, can't open)
  //               n≥2       → 1 + ceil((n-2)/2)
  //   n=2 → 1, n=3 → 2, n=4 → 2, n=5 → 3, n=6 → 3, n=7 → 4 …
  const totalSpreads =
    state.pages.length <= 1 ? 0 : 1 + Math.ceil((state.pages.length - 2) / 2);

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
  // rightIdx = spreadIndex * 2 - 1
  // leftIdx  = spreadIndex * 2 - 2  (but left is always null for spread 1 — inside cover)
  // pageBelowLeft/Right: physical page beneath in the stack = same index + 2.
  const getCurrentPages = useCallback(() => {
    const rightIdx = state.spreadIndex * 2 - 1;
    const leftIdx = state.spreadIndex * 2 - 2;
    const isSpreadOne = state.spreadIndex === 1;
    return {
      left: isSpreadOne ? null : (state.pages[leftIdx] ?? null),
      right: state.pages[rightIdx] ?? null,
      leftIndex: isSpreadOne ? -1 : leftIdx,
      rightIndex: rightIdx,
      pageBelowLeft: isSpreadOne ? null : (state.pages[leftIdx + 2] ?? null),
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
