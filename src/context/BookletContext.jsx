import { createContext, useContext, useReducer, useCallback } from 'react';

const BookletContext = createContext(null);

const PAGE_SIZES = {
  A5:     { width: 148, height: 210, label: 'A5' },
  A4:     { width: 210, height: 297, label: 'A4' },
  A3:     { width: 297, height: 420, label: 'A3' },
  Square: { width: 210, height: 210, label: 'Square' },
};

const BINDING_TYPES = {
  ring:    { label: 'Ring Bound' },
  perfect: { label: 'Perfect Bound' },
  chicago: { label: 'Chicago Screw' },
};

const initialState = {
  // Regular pages:
  //   pages[0]  = front cover (shown closed only)
  //   pages[1]  = inside front cover (left of spread 1)
  //   Spread N  → left: pages[N*2-1], right: pages[N*2]
  //   totalSpreads = floor(pages.length / 2)
  pages: [],

  // Trace inserts — separate from regular pages.
  // One per spread max: { id, src, spreadIndex, turned }
  // 'turned' = the insert has been flipped to the left side of the spread.
  traceInserts: [],

  pageSize:    'A4',
  orientation: 'portrait',
  binding:     'perfect',
  spreadIndex: 0,   // 0 = closed, 1+ = open spread
  isOpen:      false,
  panelOpen:   true,
};

let nextId = 1;

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_PAGES': {
      const newPages = action.payload.map((src) => ({ id: nextId++, src }));
      return { ...state, pages: [...state.pages, ...newPages] };
    }
    case 'REMOVE_PAGE':
      return { ...state, pages: state.pages.filter((p) => p.id !== action.payload) };
    case 'REORDER_PAGES':
      return { ...state, pages: action.payload };

    case 'ADD_TRACE_INSERT': {
      // Replace any existing insert for this spread
      const existing = state.traceInserts.filter((t) => t.spreadIndex !== action.payload.spreadIndex);
      return {
        ...state,
        traceInserts: [...existing, { id: nextId++, src: action.payload.src, spreadIndex: action.payload.spreadIndex, turned: false }],
      };
    }
    case 'REMOVE_TRACE_INSERT':
      return { ...state, traceInserts: state.traceInserts.filter((t) => t.spreadIndex !== action.payload) };
    case 'TOGGLE_TRACE_TURNED':
      return {
        ...state,
        traceInserts: state.traceInserts.map((t) =>
          t.spreadIndex === action.payload ? { ...t, turned: !t.turned } : t
        ),
      };

    case 'SET_PAGE_SIZE':    return { ...state, pageSize: action.payload };
    case 'SET_ORIENTATION':  return { ...state, orientation: action.payload };
    case 'SET_BINDING':      return { ...state, binding: action.payload };
    case 'SET_SPREAD_INDEX': return { ...state, spreadIndex: action.payload };
    case 'OPEN_BOOK':        return { ...state, isOpen: true, spreadIndex: 1 };
    case 'CLOSE_BOOK':       return { ...state, isOpen: false, spreadIndex: 0 };
    case 'TOGGLE_PANEL':     return { ...state, panelOpen: !state.panelOpen };
    default: return state;
  }
}

export function BookletProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addPages          = useCallback((srcs) => dispatch({ type: 'ADD_PAGES', payload: srcs }), []);
  const removePage        = useCallback((id)   => dispatch({ type: 'REMOVE_PAGE', payload: id }), []);
  const reorderPages      = useCallback((p)    => dispatch({ type: 'REORDER_PAGES', payload: p }), []);

  const addTraceInsert    = useCallback((spreadIndex, src) =>
    dispatch({ type: 'ADD_TRACE_INSERT', payload: { spreadIndex, src } }), []);
  const removeTraceInsert = useCallback((spreadIndex) =>
    dispatch({ type: 'REMOVE_TRACE_INSERT', payload: spreadIndex }), []);
  const toggleTraceTurned = useCallback((spreadIndex) =>
    dispatch({ type: 'TOGGLE_TRACE_TURNED', payload: spreadIndex }), []);

  const setPageSize    = useCallback((s) => dispatch({ type: 'SET_PAGE_SIZE',   payload: s }), []);
  const setOrientation = useCallback((o) => dispatch({ type: 'SET_ORIENTATION', payload: o }), []);
  const setBinding     = useCallback((b) => dispatch({ type: 'SET_BINDING',     payload: b }), []);
  const openBook       = useCallback(()  => dispatch({ type: 'OPEN_BOOK' }), []);
  const closeBook      = useCallback(()  => dispatch({ type: 'CLOSE_BOOK' }), []);
  const togglePanel    = useCallback(()  => dispatch({ type: 'TOGGLE_PANEL' }), []);

  const totalSpreads = Math.floor(state.pages.length / 2);

  const goNext = useCallback(() => {
    if (!state.isOpen) { dispatch({ type: 'OPEN_BOOK' }); return; }
    if (state.spreadIndex < totalSpreads)
      dispatch({ type: 'SET_SPREAD_INDEX', payload: state.spreadIndex + 1 });
  }, [state.isOpen, state.spreadIndex, totalSpreads]);

  const goPrev = useCallback(() => {
    if (state.spreadIndex <= 1) dispatch({ type: 'CLOSE_BOOK' });
    else dispatch({ type: 'SET_SPREAD_INDEX', payload: state.spreadIndex - 1 });
  }, [state.spreadIndex]);

  // leftIdx(N) = N*2-1,  rightIdx(N) = N*2
  const getCurrentPages = useCallback(() => {
    const leftIdx  = state.spreadIndex * 2 - 1;
    const rightIdx = state.spreadIndex * 2;
    return {
      left:  state.pages[leftIdx]  ?? null,
      right: state.pages[rightIdx] ?? null,
      leftIndex:  leftIdx,
      rightIndex: rightIdx,
    };
  }, [state.spreadIndex, state.pages]);

  const getTraceInsert = useCallback((spreadIndex) =>
    state.traceInserts.find((t) => t.spreadIndex === spreadIndex) ?? null,
  [state.traceInserts]);

  const value = {
    ...state,
    PAGE_SIZES,
    BINDING_TYPES,
    totalSpreads,
    addPages,
    removePage,
    reorderPages,
    addTraceInsert,
    removeTraceInsert,
    toggleTraceTurned,
    setPageSize,
    setOrientation,
    setBinding,
    openBook,
    closeBook,
    togglePanel,
    goNext,
    goPrev,
    getCurrentPages,
    getTraceInsert,
  };

  return <BookletContext.Provider value={value}>{children}</BookletContext.Provider>;
}

export function useBooklet() {
  const ctx = useContext(BookletContext);
  if (!ctx) throw new Error('useBooklet must be used within BookletProvider');
  return ctx;
}
