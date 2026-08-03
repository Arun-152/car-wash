import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 2) {
      endPage = Math.min(totalPages, 5);
    }
    
    if (currentPage >= totalPages - 1) {
      startPage = Math.max(1, totalPages - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="pagination-container">
      <button
        className="pagination-btn nav-btn"
        onClick={handlePrevious}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} />
        <span className="nav-text">Previous</span>
      </button>

      <div className="pagination-numbers">
        {pages[0] > 1 && (
          <>
            <button className="pagination-btn" onClick={() => onPageChange(1)}>1</button>
            {pages[0] > 2 && <span className="pagination-ellipsis">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
            <button className="pagination-btn" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
          </>
        )}
      </div>

      <button
        className="pagination-btn nav-btn"
        onClick={handleNext}
        disabled={currentPage === totalPages}
      >
        <span className="nav-text">Next</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;
