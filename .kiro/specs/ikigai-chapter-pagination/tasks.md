# Implementation Plan: Ikigai Chapter Pagination

## Overview

Este plan implementa la extracción completa de capítulos de Ikigai mediante navegación automática por páginas paginadas. La implementación modificará el archivo `api/ikigai/chapters.js` para reemplazar el enfoque de scroll infinito con navegación basada en URLs con parámetro `?pagina=N`.

## Tasks

- [x] 1. Implement pagination detection function
  - Create `detectTotalPages(page)` function
  - Search for pagination controls in DOM using multiple selectors
  - Extract highest page number from pagination links
  - Return 1 if no pagination found
  - Validate page number is between 1 and 100
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement chapter extraction function
  - Create `extractChaptersFromPage(page)` function
  - Find all `<a>` elements in the page
  - Filter links containing `/capitulo/` in href
  - Extract chapter number, title, and URL from each link
  - Validate chapter numbers are in range 0-9999
  - Return array of chapter objects
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 3. Implement chapter consolidation function
  - Create `consolidateChapters(allChapters)` function
  - Flatten array of arrays into single array
  - Remove duplicates using Map with chapter number as key
  - Preserve first occurrence of each duplicate
  - Sort by chapter number in descending order
  - Return consolidated array
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4. Refactor main handler to use pagination
  - Remove scroll-based chapter loading logic
  - Add call to `detectTotalPages()` after loading first page
  - Implement loop to navigate through pages 1 to N
  - For each page, construct URL with `?pagina=N` parameter
  - Navigate to each page URL
  - Wait for Cloudflare challenge on each page
  - Call `extractChaptersFromPage()` for each page
  - Accumulate chapters in array
  - Add error handling for page load failures
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.3, 3.4_

- [x] 5. Update response structure
  - Call `consolidateChapters()` with accumulated chapters
  - Return response with `chapters`, `total`, and `pagesScanned` fields
  - Update `pagesScanned` to reflect actual pages processed (not scroll attempts)
  - Ensure each chapter has `chapter`, `title`, and `url` fields
  - _Requirements: 4.5, 8.2, 8.3_

- [x] 6. Enhance logging
  - Add log for slug and base URL at start
  - Add log for total pages detected
  - Add log for each page being processed with page number
  - Add log for chapters found per page
  - Add log for total unique chapters and pages scanned at end
  - Add error logs with page number and error details
  - Add log for duplicates removed count
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Checkpoint - Verify implementation
  - Test manually with a known manga (e.g., Jinx with 4 pages)
  - Verify all chapters from all pages are retrieved
  - Verify no duplicates in results
  - Verify chapters are sorted descending
  - Ask the user if questions arise

- [x] 8. Add API validation
  - Verify HTTP method is POST (already exists)
  - Verify slug parameter exists in request body (already exists)
  - Ensure error responses use correct HTTP status codes
  - _Requirements: 8.1, 8.4, 8.5_

- [ ] 9. Final verification
  - Test with multiple different mangas
  - Verify pagination detection works correctly
  - Verify error handling works for failed pages
  - Verify logging is complete and helpful
  - Ask the user if questions arise

## Notes

- Each task references specific requirements for traceability
- The implementation will reuse the existing browser instance and anti-detection measures
- Cloudflare challenge handling already exists and will be reused
- Focus on replacing scroll logic with pagination logic in the main handler
- Manual testing will be used instead of automated tests since the project is already advanced
