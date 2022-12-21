export const d3bar = ((d3, commons) => {
    const {wrap, collisiondetection} = commons;
    let defaults = {
     jsdom: false
    };   
    return (config) => {
     config = Object.assign(defaults, config);
 
     function chart(selection, opts?){
         opts = Object.assign({}, config, opts || {});
         selection.each(function(props){
            draw(this, Object.assign({}, opts, props));
         })
         return chart;
      }   
 
      const draw = (elem, props) => {
         let {title, data, width, height, margin
             , xvar, yvar, color : defaultColor, valueformatter, colorgen 
             , xscaletype, yscaletype, colorscheme
             , interpolatetype, tooltip
         } = props;
      
         data = data && JSON.parse(data);
         margin = margin && JSON.parse(margin);
         width = width || elem.getBoundingClientRect().width;
         height = height || width;
         colorscheme = colorscheme && colorscheme.split(',')
 
         let svg = d3.select(elem).selectAll('svg.chart')                   
             .data([{data: data, xVar: xvar}])
             .join('svg').attr('class', 'chart')
             .attr('width', width).attr('height', height)
             .attr("viewBox", [0, 0, width, height])        
         , ch = height - margin.top - margin.bottom 
         , cw = width - margin.left - margin.right
         
         , color = (colorgen && colorgen(data, xvar, interpolatetype)) || defaultColor
         ; 
      
       
         title && svg.selectAll('g.title')                
         .data([[title]])
         .join('g').attr('class', 'title')
         .attr('transform', `translate(${[cw /2, margin.top/2]})`)
         .selectAll('text').data(d => d)
         .join('text').attr('text-anchor', 'middle')
         .attr('dy', '.35em')
         .html(d => d)
         .call(wrap, cw)
         .each(function(d) {
             var bb = this.getBBox();
             d3.select(this).attr('transform', `translate(${[0, -(bb.height / 3)]})`)
         })
         ;   
         
 
         let _xscaletype = xscaletype.split('.') 
         , visualize = svg.selectAll('g.visualize')
         .data([data])
         .join('g').attr('class', 'visualize')
         .attr('transform', `translate(${[margin.left, margin.top]})`)
         , copt = {
             multiplier: [1]
             , series: yvar.split(',').map(d => d.trim())
             , points: xvar.split(',').map(d => d.trim())            
         }
         ;
 
         visualize.selectAll('g.plot')
                  .data(d => [calculateseries(d, copt)])
                  .join('g').attr('class', 'plot')
                  .call(stackedBarChart, {
                     width: cw
                     , height: ch
                     , x: d => d.key 
                     , y: d => d.value 
                     , z: d => d.value.map(dd => dd.key).flat(3)
                     , xscale: commons.scale(_xscaletype[0])
                     , xtickformat: commons.tickFormat(_xscaletype[0], _xscaletype[1])
                     , ytickformat: d3.format("~s")
                     , tooltip, colorscheme 
                 })
         ; 
         
      }
  
      function stackedBarChart(visualize, {
         x = (d, i) => i, // given d in data, returns the (ordinal) x-value
         y = d => d, // given d in data, returns the (quantitative) y-value
         z = d => d, // given d in data, returns the (categorical) z-value 
         xscale = null,
         yscale = null,
         zscale = null, 
         xtickformat = null,
         ytickformat = null,
         width = null, // outer width, in pixels
         height = null, // outer height, in pixels
         xDomain = null, // array of x-values
         xRange = [0, width], // [left, right]
         xPadding = 0.1, // amount of x-range to reserve to separate bars
         yType = d3.scaleLinear, // type of y-scale
         yDomain = null, // [ymin, ymax]
         yRange = [height, 0], // [bottom, top]
         zDomain = null, // array of z-values
         offset = d3.stackOffsetDiverging, // stack offset method
         order = d3.stackOrderNone, // stack order method 
         colorscheme = d3.schemeTableau10, // array of colors
         tooltip = null 
      } = {}){ 
         const data = visualize.datum();
         const X = data.map(x); 
         const Y = data.map(y);
         const Z = data.map(z); 
         const formatter = commons.formatters.count;
 
         if(!xDomain) xDomain = X;
         if(!yDomain) yDomain = d3.extent(Y.flat(3));
         if(!zDomain) zDomain = Z.flat().unique();
 
         if(!yscale) yscale = yType(yDomain, yRange); 
         if(!zscale) zscale = d3.scaleOrdinal(zDomain, colorscheme);
 
         xscale.domain(xDomain).range(xRange).paddingInner(0.1);
 
         const xaxis = d3.axisBottom().scale(xscale).tickFormat(xtickformat);
         const yaxis = d3.axisLeft().scale(yscale).tickFormat(ytickformat).ticks(5); 
 
         visualize.selectAll('g.x.axis')
         .data([0])
         .join('g').attr('class', 'x axis')
         .attr('transform', `translate(${[0, height]})`)
         .call(xaxis);  
 
         visualize.selectAll('g.y.axis')
         .data([0])
         .join('g').attr('class', 'y axis')
         .attr('transform', `translate(${[0, 0]})`)
         .call(yaxis);
  
         const ttip = commons.tooltip();
         const mouseover = function(d) {
             let nodes = [];
             d3.select(this).selectAll('rect')
               .each(dd => {
                 if(dd[0] && dd[0].data){
                     nodes.push(
                         Object.assign({}, 
                             {key: dd.key, value: formatter(dd[0].data[dd.key]), color: zscale(dd.key)}) 
                     );
                 }
               })
         
             tooltip && ttip.content(tooltip({label: xtickformat(d.key), list: nodes}))
                            .showtip(); 
         }
 
         const mouseout = d => {
              ttip.hidetip();
         }
  
         visualize.selectAll('g.grp-nest')
                  .data(data)
                  .join('g').attr('class', 'grp-nest')
                  .call(_draw_nbars, 0, xscale, {zscale, yscale, xscale, isstacked: true, mouseover, mouseout, formatter}) 
         ;
       
      }
 
      const _draw_nbars = function (elm, depth, px, opt) {
         let {zscale, yscale, xscale, isstacked, mouseover, mouseout, formatter} = opt;
         var pd = elm.datum()
             ;
         
         if (pd.value) {    
             let scale = d3.local()
             , bw = px.bandwidth()
             ;
           
             elm      
                 .attr('transform', function (d) { return `translate(${[px(d.key) + ((px.bandwidth() - bw) / 2), 0]})`; })
                 .property(scale, function (d) { return zscale(d.key); })
                 .selectAll('rect.bar')
                 .data(function (d) {                   
                    return d.value;
                 })            
                 .join('rect').attr('class','bar')
                 .attr('fill', function (d, i) { return zscale(d.key); })
                 .attr('stroke', function (d, i) { return zscale(d.key); })
                 .attr('width', bw)
                 .attr('x', 0)
                 .each(function (d, i) {
                    //add outlier
                     var h = isNaN(d[0][0]) || isNaN(d[0][1]) ? null : Math.abs(yscale(d[0][0]) - yscale(d[0][1])) 
                         ;
                     if (h != null) {
                         d3.select(this)
                             .attr('y', function (d) { return yscale(d[0][1]); })
                             .attr('height', h > 0 ? h : i == 0 ? 2 : 0); //add min height
                     }
                     else {//outlier  
                                            
                         d3.select(this)
                             .attr('height', 2)
                             .attr('y', yscale(0) + 1)
                        ;
                     }
 
                 })
 
                 .each(function (d, i) {                     
                     var e = d3.select(this)
                       , h = +e.attr('height')
                       , w = +e.attr('width')
                       , pd = d3.select(this.parentNode).datum();
                 
                     var da, doff;
 
                     if (pd.value && pd.value.length > 1 && i < pd.value.length - 1) {//more than one bar and not the top bar                        
                             da = [1, w, h, w, h];
                             doff = 1; 
                     }
                     else {//not base bar 
                         da = [w + h, w, h];
                     }
                     d3.select(this).attr('stroke-dasharray', da.join(' '));
 
                     if (doff)
                         d3.select(this).attr('stroke-dashoffset', doff);
                 })
                 ;
 
             !isstacked && elm
                 .selectAll('text')
                 .data(function (d) {
                     return d.value.filter(function (dd) { return !isNaN(dd[0][0]) && !isNaN(dd[0][1]); });
                 })
                 .join('text')
                 .attr('x', bw / 2)
                 .attr('y', function (d) { return Math.max(0, yscale(d[0][1])); })
                 .attr('dy', '-0.5em')
                 .attr('text-anchor', 'middle')
                 .text(function (d) { return formatter(d[0].data[d.key]); });
 
             elm 
                 .on('touchmove mousemove', mouseover)
                 .on('touchend mouseleave', mouseout)
                 .classed('series', true);
             return;
         }
         else
             elm.attr('transform', function (d) { return `translate(${[px(d.key), 0]})`; });
 
         var cx = xscale.copy()
             .domain(pd.values.map(function (d) { return d.key; }))
             .range([0, px.bandwidth()]);
         elm.selectAll(`g.nest-${depth}`)
             .data(function (d) { return d.values; })
             .join('g').attr('class', function (d) { return `nest-${depth}`; })
             .call(_draw_nbars, ++depth, cx, opt);
     }
 
 
      const calculateseries = (data: any[], {multiplier, series, points,comparators}: any) =>{
          let _nMultiplier = multiplier ? multiplier.filter(d => d < 0).length : 0
          ,  _series = _nMultiplier > 0 ? [].concat(
             series.slice(0, _nMultiplier).reverse(),
             series.slice(_nMultiplier)) : series 
          ,  _pkey = points.join('.')
          ,  _d = multiplier ? 
             data.map(d => {
                 let _td = Object.assign({}, d);
                 _series.forEach((ser, sndx) => {
                     _td[ser] = !isNaN(d[ser]) && parseFloat(d[ser]) * multiplier[sndx % multiplier.length] || null;                 
                 })
                 _td[_pkey] = points.map(p => d[p]).join('.');
                 
                 return _td;
             }) : data.slice()  
         , nest = d3.nest()          
          ;
 
        
 
          points.forEach(p => {
             nest.key(d => d[p].toLowerCase())
                 .sortKeys(comparators && comparators[p]);
          });
 
          return nest.rollup(d => {
               return d3.stack()
                        .keys(_series)
                        .offset(d3.stackOffsetDiverging)(d)
                        ;
          }).entries(_d);
 
      }
 
      const leavenodes = function (d) {   
         if (d.value) {
             return d;
         } 
     
         return [].concat.apply([], d.values.map(leavenodes));
     }
  
      return chart;
    }
 });
  