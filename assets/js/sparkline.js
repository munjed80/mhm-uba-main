// sparkline.js — Mini chart components for KPI cards
(function() {
  'use strict';
  
  /**
   * Create a simple SVG sparkline chart
   * @param {HTMLElement} container - Container element to render chart in
   * @param {Array} data - Array of numbers to plot
   * @param {Object} options - Chart options
   */
  function createSparkline(container, data, options = {}) {
    const defaults = {
      width: 80,
      height: 24,
      lineColor: '#10b981',
      fillColor: 'rgba(16, 185, 129, 0.1)',
      strokeWidth: 2,
      showDots: false,
      animate: true
    };
    
    const opts = { ...defaults, ...options };
    
    if (!data || data.length < 2) {
      container.innerHTML = '<span class="uba-sparkline-empty">—</span>';
      return;
    }
    
    // Clean data
    const cleanData = data.map(d => parseFloat(d) || 0);
    const max = Math.max(...cleanData);
    const min = Math.min(...cleanData);
    const range = max - min;
    
    if (range === 0) {
      container.innerHTML = '<span class="uba-sparkline-flat">—</span>';
      return;
    }
    
    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', opts.width);
    svg.setAttribute('height', opts.height);
    svg.setAttribute('viewBox', `0 0 ${opts.width} ${opts.height}`);
    svg.classList.add('uba-sparkline');
    
    // Create path
    const pathData = cleanData.map((value, index) => {
      const x = (index / (cleanData.length - 1)) * opts.width;
      const y = opts.height - ((value - min) / range) * opts.height;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    // Add fill area if specified
    if (opts.fillColor) {
      const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const fillData = pathData + ` L ${opts.width} ${opts.height} L 0 ${opts.height} Z`;
      fillPath.setAttribute('d', fillData);
      fillPath.setAttribute('fill', opts.fillColor);
      fillPath.setAttribute('stroke', 'none');
      svg.appendChild(fillPath);
    }
    
    // Add main line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', opts.lineColor);
    path.setAttribute('stroke-width', opts.strokeWidth);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    
    if (opts.animate) {
      const pathLength = path.getTotalLength();
      path.style.strokeDasharray = pathLength;
      path.style.strokeDashoffset = pathLength;
      path.style.animation = 'uba-sparkline-draw 1s ease-out forwards';
    }
    
    svg.appendChild(path);
    
    // Add dots if specified
    if (opts.showDots) {
      cleanData.forEach((value, index) => {
        const x = (index / (cleanData.length - 1)) * opts.width;
        const y = opts.height - ((value - min) / range) * opts.height;
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', 1.5);
        circle.setAttribute('fill', opts.lineColor);
        svg.appendChild(circle);
      });
    }
    
    // Clear container and add SVG
    container.innerHTML = '';
    container.appendChild(svg);
    
    // Add trend indicator
    const trend = cleanData[cleanData.length - 1] - cleanData[0];
    const trendClass = trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat';
    container.classList.add(`uba-sparkline-trend-${trendClass}`);
  }
  
  /**
   * Create a simple bar sparkline (for categorical data)
   */
  function createSparklineBars(container, data, options = {}) {
    const defaults = {
      width: 80,
      height: 24,
      barColor: '#10b981',
      barOpacity: 0.8,
      spacing: 2
    };
    
    const opts = { ...defaults, ...options };
    
    if (!data || data.length === 0) {
      container.innerHTML = '<span class="uba-sparkline-empty">—</span>';
      return;
    }
    
    const cleanData = data.map(d => parseFloat(d) || 0);
    const max = Math.max(...cleanData);
    
    if (max === 0) {
      container.innerHTML = '<span class="uba-sparkline-empty">—</span>';
      return;
    }
    
    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', opts.width);
    svg.setAttribute('height', opts.height);
    svg.setAttribute('viewBox', `0 0 ${opts.width} ${opts.height}`);
    svg.classList.add('uba-sparkline-bars');
    
    const barWidth = (opts.width - (opts.spacing * (cleanData.length - 1))) / cleanData.length;
    
    cleanData.forEach((value, index) => {
      const x = index * (barWidth + opts.spacing);
      const barHeight = (value / max) * opts.height;
      const y = opts.height - barHeight;
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', barHeight);
      rect.setAttribute('fill', opts.barColor);
      rect.setAttribute('opacity', opts.barOpacity);
      rect.setAttribute('rx', 1);
      
      svg.appendChild(rect);
    });
    
    container.innerHTML = '';
    container.appendChild(svg);
  }
  
  /**
   * Update an existing sparkline with new data
   */
  function updateSparkline(container, data, options = {}) {
    createSparkline(container, data, options);
  }
  
  /**
   * Create sparkline for different data types
   */
  function createKPISparkline(container, data, type = 'line', options = {}) {
    const typeDefaults = {
      line: { lineColor: '#10b981', fillColor: 'rgba(16, 185, 129, 0.1)' },
      revenue: { lineColor: '#059669', fillColor: 'rgba(5, 150, 105, 0.1)' },
      clients: { lineColor: '#3b82f6', fillColor: 'rgba(59, 130, 246, 0.1)' },
      tasks: { lineColor: '#f59e0b', fillColor: 'rgba(245, 158, 11, 0.1)' },
      projects: { lineColor: '#8b5cf6', fillColor: 'rgba(139, 92, 246, 0.1)' },
      danger: { lineColor: '#ef4444', fillColor: 'rgba(239, 68, 68, 0.1)' }
    };
    
    const typeOptions = typeDefaults[type] || typeDefaults.line;
    const finalOptions = { ...typeOptions, ...options };
    
    if (type === 'bars') {
      createSparklineBars(container, data, finalOptions);
    } else {
      createSparkline(container, data, finalOptions);
    }
  }
  
  // Expose sparkline API
  window.UBASparkline = {
    create: createSparkline,
    createBars: createSparklineBars,
    createKPI: createKPISparkline,
    update: updateSparkline
  };
  
  console.log('✓ UBA Sparkline module loaded');
  
})();