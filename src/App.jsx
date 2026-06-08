import React from 'react';
import { BookletProvider } from './context/BookletContext.jsx';
import BookletViewer from './components/BookletViewer.jsx';

export default function App() {
  return (
    <BookletProvider>
      <BookletViewer />
    </BookletProvider>
  );
}
