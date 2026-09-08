import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { ImageIcon, FileText } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDFViewer = ({ dataUrl, fileName }) => {
  const containerRef = useRef(null);
  const canvasRefs = useRef({});
  const activeRenderTasksRef = useRef([]);
  const renderVersionRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [fitPageScale, setFitPageScale] = useState(0.5);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [displayWidth, setDisplayWidth] = useState(360);
  const [pageCssHeights, setPageCssHeights] = useState({});
  const [scrollTopPos, setScrollTopPos] = useState(0);
  const [activeVisiblePage, setActiveVisiblePage] = useState(1);

  const isImage = dataUrl && (
    dataUrl.startsWith('data:image/') ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName || '')
  );

  const pageList = useMemo(() => {
    return Array.from({ length: numPages }, (_, i) => i + 1);
  }, [numPages]);

  // Load PDF Document
  useEffect(() => {
    let isMounted = true;
    if (!dataUrl) return;

    if (isImage) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    const loadDocument = async () => {
      try {
        let loadingTask;
        if (dataUrl.startsWith('data:')) {
          const parts = dataUrl.split(';base64,');
          if (parts.length >= 2) {
            const cleanBase64 = parts[1].replace(/\s/g, '');
            const raw = window.atob(cleanBase64);
            const rawLength = raw.length;
            const uInt8Array = new Uint8Array(rawLength);
            for (let i = 0; i < rawLength; ++i) {
              uInt8Array[i] = raw.charCodeAt(i);
            }
            loadingTask = pdfjsLib.getDocument({ data: uInt8Array });
          } else {
            loadingTask = pdfjsLib.getDocument(dataUrl);
          }
        } else {
          loadingTask = pdfjsLib.getDocument(dataUrl);
        }

        const doc = await loadingTask.promise;
        if (!isMounted) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch (err) {
        console.error('PDF.js parse error, will fallback:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
    };
  }, [dataUrl, isImage]);

  // Render all pages seamlessly inside one unified card
  useEffect(() => {
    if (!pdfDoc || numPages === 0 || !containerRef.current) return;

    const currentVersion = ++renderVersionRef.current;

    // Cancel any active render tasks
    activeRenderTasksRef.current.forEach(task => {
      try {
        task.cancel();
      } catch { }
    });
    activeRenderTasksRef.current = [];

    const renderPages = async () => {
      const containerEl = containerRef.current;
      if (!containerEl) return;

      const containerWidth = containerEl.clientWidth > 50 ? containerEl.clientWidth : (window.innerWidth || 360);
      const containerHeight = containerEl.clientHeight > 50 ? containerEl.clientHeight : (window.innerHeight || 600);
      const isMobile = window.innerWidth < 640;
      const horizontalPadding = isMobile ? 16 : 32;
      const availableWidth = Math.min(
        Math.max(containerWidth - horizontalPadding, 260),
        850
      );

      try {
        // Fetch all page objects
        const pages = [];
        for (let p = 1; p <= numPages; p++) {
          if (renderVersionRef.current !== currentVersion) return;
          const page = await pdfDoc.getPage(p);
          pages.push(page);
        }
        if (renderVersionRef.current !== currentVersion) return;

        // Base width scale so Page 1 fits availableWidth
        const page1Unscaled = pages[0].getViewport({ scale: 1.0 });
        const baseWidthScale = availableWidth / page1Unscaled.width;

        // Unscaled viewports to compute natural document height
        const unscaledViewports = pages.map(p => p.getViewport({ scale: baseWidthScale }));
        const naturalTotalCssHeight = unscaledViewports.reduce((sum, vp) => sum + vp.height, 0);

        // Whole page fit scale
        const availableHeight = Math.max(containerHeight - 56, 250);
        const autoFitPageScale = Math.min(
          1.0,
          Number((availableHeight / naturalTotalCssHeight).toFixed(2))
        );
        setFitPageScale(prev => (Math.abs(prev - autoFitPageScale) > 0.05 ? autoFitPageScale : prev));

        // Effective scale based on user zoom
        const effectiveScale = baseWidthScale * scaleFactor;
        const currentDisplayWidth = Math.round(page1Unscaled.width * effectiveScale);
        setDisplayWidth(currentDisplayWidth);

        // Calculate CSS heights and render viewports
        const outputScale = Math.min(window.devicePixelRatio || 1, 2.0);
        const heightsMap = {};
        const renderViewports = [];

        pages.forEach((page, idx) => {
          const pageNum = idx + 1;
          const vp = page.getViewport({ scale: effectiveScale });
          heightsMap[pageNum] = Math.round(vp.height);

          const renderVp = page.getViewport({ scale: effectiveScale * outputScale });
          renderViewports.push(renderVp);
        });

        setPageCssHeights(heightsMap);

        // Render each page directly onto its canvas
        for (let idx = 0; idx < pages.length; idx++) {
          if (renderVersionRef.current !== currentVersion) return;

          const pageNum = idx + 1;
          const canvas = canvasRefs.current[pageNum];
          if (!canvas) continue;

          const page = pages[idx];
          const renderVp = renderViewports[idx];

          const pixelWidth = Math.ceil(renderVp.width);
          const pixelHeight = Math.ceil(renderVp.height);

          canvas.width = pixelWidth;
          canvas.height = pixelHeight;
          canvas.style.width = `${currentDisplayWidth}px`;
          canvas.style.height = `${heightsMap[pageNum]}px`;

          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pixelWidth, pixelHeight);

          const renderContext = {
            canvasContext: ctx,
            viewport: renderVp
          };

          const task = page.render(renderContext);
          activeRenderTasksRef.current.push(task);

          await task.promise;
          if (renderVersionRef.current !== currentVersion) return;
        }

        if (renderVersionRef.current === currentVersion) {
          setLoading(false);
        }
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF pages:', err);
        }
      }
    };

    renderPages();

    let resizeTimer = null;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderPages();
      }, 200);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      activeRenderTasksRef.current.forEach(t => {
        try { t.cancel(); } catch { }
      });
    };
  }, [pdfDoc, numPages, scaleFactor]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    setScrollTopPos(scrollTop);

    if (numPages > 1 && canvasRefs.current[2]) {
      const page2El = canvasRefs.current[2];
      const page2Top = page2El.offsetTop - containerRef.current.offsetTop;
      if (scrollTop + clientHeight / 3 >= page2Top) {
        setActiveVisiblePage(2);
        return;
      }
    }
    setActiveVisiblePage(1);
  };

  // Scroll to specific page
  const scrollToPage = (pageNum) => {
    if (!containerRef.current) return;
    if (pageNum === 1) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (canvasRefs.current[pageNum]) {
      const targetEl = canvasRefs.current[pageNum];
      const targetTop = targetEl.offsetTop - containerRef.current.offsetTop;
      containerRef.current.scrollTo({ top: Math.max(0, targetTop - 8), behavior: 'smooth' });
    }
  };

  // If this is an image file
  if (isImage) {
    return (
      <div className="w-full h-full flex flex-col bg-gray-100 dark:bg-slate-950 overflow-hidden relative">
        <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs shrink-0 shadow-2xs">
          <span className="text-gray-600 dark:text-slate-300 font-semibold text-[11px] sm:text-xs flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
            Ảnh CV ({Math.round(scaleFactor * 100)}%)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setScaleFactor(prev => Math.max(0.4, Number((prev - 0.15).toFixed(2))))}
              className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 active:bg-gray-300 text-gray-700 dark:text-slate-200 font-bold flex items-center justify-center cursor-pointer text-sm"
              title="Thu nhỏ"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setScaleFactor(1.0)}
              className={`px-2 h-7 rounded-lg font-semibold flex items-center justify-center cursor-pointer text-[11px] ${
                scaleFactor === 1.0 ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300'
              }`}
              title="Vừa bề ngang"
            >
              Vừa bề ngang
            </button>
            <button
              type="button"
              onClick={() => setScaleFactor(fitPageScale)}
              className={`px-2 h-7 rounded-lg font-semibold flex items-center justify-center cursor-pointer text-[11px] ${
                scaleFactor === fitPageScale ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300'
              }`}
              title="Toàn cảnh"
            >
              Toàn cảnh
            </button>
            <button
              type="button"
              onClick={() => setScaleFactor(prev => Math.min(2.5, Number((prev + 0.15).toFixed(2))))}
              className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 active:bg-gray-300 text-gray-700 dark:text-slate-200 font-bold flex items-center justify-center cursor-pointer text-sm"
              title="Phóng to"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 pb-28 flex justify-center items-start">
          <img
            src={dataUrl}
            alt={fileName || 'CV'}
            className="rounded-xl shadow-md block object-contain transition-transform origin-top"
            style={{
              width: `${Math.round(100 * scaleFactor)}%`,
              maxWidth: scaleFactor <= 1 ? '100%' : 'none'
            }}
          />
        </div>
      </div>
    );
  }

  // Fallback to iframe if pdfjs fails
  if (error) {
    return (
      <iframe
        src={dataUrl}
        className="w-full h-full border-0 block flex-1 bg-white dark:bg-slate-900"
        title="CV Preview Fallback"
      />
    );
  }

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col bg-gray-100 dark:bg-slate-950 overflow-hidden relative">
      {/* Top Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-2.5 sm:px-4 py-1.5 flex items-center justify-between text-xs shrink-0 shadow-2xs z-10">
        {/* Page counter & Quick page buttons */}
        <div className="flex items-center gap-1.5 text-gray-700 dark:text-slate-300 font-semibold text-[11px] sm:text-xs">
          <FileText className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
          <span>{numPages > 0 ? (numPages > 1 ? `${numPages} trang` : '1 trang') : 'Đang tải...'}</span>
        </div>

        {/* Zoom & View Modes */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setScaleFactor(prev => Math.max(0.35, Number((prev - 0.15).toFixed(2))))}
            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 active:bg-gray-300 text-gray-700 dark:text-slate-200 font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
            title="Thu nhỏ (-)"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => {
              setScaleFactor(1.0);
              if (containerRef.current) containerRef.current.scrollTop = 0;
            }}
            className={`px-2 h-7 rounded-lg font-semibold flex items-center justify-center transition-colors cursor-pointer text-[11px] ${
              scaleFactor === 1.0
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold'
                : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
            }`}
            title="Vừa khít chiều ngang màn hình (cuộn dọc đọc nét nhất)"
          >
            Vừa bề ngang
          </button>
          <button
            type="button"
            onClick={() => {
              setScaleFactor(fitPageScale);
              if (containerRef.current) containerRef.current.scrollTop = 0;
            }}
            className={`px-2 h-7 rounded-lg font-semibold flex items-center justify-center transition-colors cursor-pointer text-[11px] ${
              scaleFactor === fitPageScale
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold'
                : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
            }`}
            title="Toàn cảnh (thu gọn tất cả trang trong 1 màn hình)"
          >
            Toàn cảnh
          </button>
          <button
            type="button"
            onClick={() => setScaleFactor(prev => Math.min(2.5, Number((prev + 0.15).toFixed(2))))}
            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 active:bg-gray-300 text-gray-700 dark:text-slate-200 font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
            title="Phóng to (+)"
          >
            +
          </button>
        </div>
      </div>

      {/* Pages Scroll Container - Native vertical touch swiping enabled */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden p-2 sm:p-4 pb-36 flex flex-col items-center"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center h-48 space-y-2 text-gray-500 dark:text-slate-400 my-auto">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold">Đang chuẩn bị hiển thị trọn vẹn toàn bộ CV...</span>
          </div>
        )}

        {/* ONE SINGLE unified continuous card - 0px gap between pages */}
        <div
          className={`bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-200/90 dark:border-slate-800 overflow-hidden flex flex-col items-center select-none shrink-0 transition-opacity ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            width: `${displayWidth}px`,
            maxWidth: scaleFactor <= 1 ? '100%' : 'none'
          }}
        >
          {pageList.map(pageNum => (
            <canvas
              key={pageNum}
              ref={el => {
                if (el) canvasRefs.current[pageNum] = el;
              }}
              className="block"
              style={{
                display: 'block',
                margin: 0,
                padding: 0,
                border: 'none',
                outline: 'none',
                lineHeight: 0,
                verticalAlign: 'top',
                width: `${displayWidth}px`,
                height: `${pageCssHeights[pageNum] || 500}px`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
