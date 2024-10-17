export const d3timetable = ((d3, commons) => {
  let {wrap, makeDayTimeIntervals, pickBestContrast, formatters} = commons;
  let defaults = {
      valueformatter: null
  };

  return (config) => {
      config = Object.assign(defaults, config);

      function chart(selection, opts?){
          opts = Object.assign({}, config, opts || {});

          selection.each(function(props){               
             draw(this, Object.assign({}, opts, props));            
          });

          return chart;
       }
     
      const cellsize = 25;
      const symbols = [
          {type: 'add', symbol: 'plus', title: 'Add to Calendar'}
       ,  {type: 'delete', symbol: 'trash-can', title: 'Delete event from Calendar'}
       ,  {type: 'edit', symbol: 'pencil', title: 'Edit event in Calendar'}
  ]
      const draw = (elem, props) => {
          let {title, width, height, margin
          , colorscheme, zdomain, data, allowed
          , xvar, yvars  
          , tooltip, onclick, scrollto
          , view, start, readonly
          } = props;


          data = data && JSON.parse(data);
          allowed = allowed && JSON.parse(allowed);
          width = width || elem.clientWidth;
          height = height || elem.clientHeight;
          margin = margin && JSON.parse(margin);
          yvars = yvars && JSON.parse(yvars);
          colorscheme = colorscheme && JSON.parse(colorscheme);
          zdomain = zdomain && JSON.parse(zdomain); 
          scrollto = scrollto || 0;
          start = start || data && data[data.length - 1];
          readonly = readonly == "true";

          let step = 15
          ,   cw = width - margin.left - margin.right
          ,   ch = height - margin.top - margin.bottom  
          ,   wk = makeWeek(new Date(`${start} 00:00:00`))
          ,   wkdays = d3.timeDay.every(1).range(...wk)
          ,   timeintervals = makeDayTimeIntervals(step)
          ,   intervalvalues = timeintervals.map(d => d.value)
          ,   xscale = d3.scaleBand().domain(wkdays).range([0, cw])
                         .paddingInner(0).paddingOuter(0).align(0).round(false)
          ,   xaxis = d3.axisTop(xscale)
                        .tickSize(0).tickValues(wkdays)
                        .tickFormat(d3.timeFormat('%A %x'))
          ,   yscale = d3.scaleLinear().range([0, ch])
          ,   yscroll = d3.scaleBand().domain(intervalvalues).range([0, ch])
                         .paddingInner(0).paddingOuter(0).align(0).round(false)
          ,   ytickformatter = d => timeintervals.filter(t => t.value === d)
                                  .map(t => t.label.replace(/^0?([1-9][0-9]?):00\s([am|pm]*)/i, `$1 $2`))
          ,   cellheight = Math.max(yscroll.bandwidth(), cellsize)
          ,   hasscroll = yscroll.bandwidth() < cellsize 
          ,   numberrows = Math.floor(ch / cellheight)
          ,   displayed = d3.scaleQuantize().domain([0, ch])
                            .range(d3.range(intervalvalues.length)) 
          ; 

          const svg =  d3.select(elem).selectAll("svg")
          .data([0]).join('svg')
          .attr("viewBox", [0, 0, width, height])
          .attr("width", width)
          .attr("height", height);
    
           svg.selectAll("rect.background")
           .data([0]).join('rect').attr('class', 'background')
           .attr("width", width).attr("height", height);

          let layers =  makelayers(xvar, yvars, allowed, data, readonly, onclick, tooltip)
          , renderer = scrollableSection(svg, xscale, yscale, ytickformatter, margin, layers);

          
          svg.selectAll('g.yscroll')
          .data(hasscroll ? [0] : [])
          .join('g').attr('class', 'yscroll')
          .attr('transform', `translate(${[cw + margin.left, margin.top]})`)
          .call(renderyscroller, intervalvalues, numberrows, ch, margin.right, displayed, renderer, yscroll(clamptostep(+scrollto, step)))
        ;            

          if(!hasscroll){
              renderer(intervalvalues);
          }

          svg.selectAll('g.x.axis')
          .data([0])
          .join('g').attr('class', 'x axis')
          .attr('transform', `translate(${[margin.left, margin.top]})`)
          .call(xaxis)
          .selectAll('g.tick')
          .each(function(d){
            d3.select(this)
              .insert('rect', 'text')
              .attr('transform', `translate(${[-xscale.bandwidth() / 2, -margin.top]})`)
              .attr('width', xscale.bandwidth())
              .attr('height', margin.top)
            ;

            d3.select(this)
              .selectAll('text')
              .attr('y', -margin.top / 2)
              .attr('dy', -0.5)
              .attr('dominant-baseline', 'middle')        
              .call(wrap, Math.min(90, xscale.bandwidth()),1.2)
            ;
          })
          

          return chart;
      }

      const renderyscroller = (yscroller, domain, numberrows, height, width, displayed, renderer, scrollTo) => {
          let scrollerheight =  Math.ceil(numberrows * height / domain.length)
          , dragcb = scrolldisplay(height, scrollerheight, displayed, renderer, domain, numberrows)
          , clickcb = clickintoview(height, scrollerheight, displayed, renderer, domain, numberrows)
          ;

          yscroller.selectAll('rect.drag-track')
             .data([0])
             .join('rect').attr('class', 'drag-track')
             .attr('x', 0).attr('y', 0)
             .attr('width', width).attr('height', height)
            
          ;

          yscroller.selectAll('rect.drag')
            .data([0])
            .join('rect').attr('class', 'drag') 
            .attr('x', 0)
            .attr('y', scrollTo || 0)
            .attr('width', width)
            .attr('height', scrollerheight)
            .attr('pointer-events', 'all')
            .attr('cursor', 'grab')
            .call(dragcb) 
            ;
        
          yscroller.selectAll('rect.drag').each(dragcb.on('drag'));  
          yscroller.on('click', clickcb);
      }
       
     const clickintoview = (height, scrollerheight, displayed, renderer, domain, numberrows) => {
         return function(d){ 
             let container = d3.select(this) 
             , scroller = container.select('rect.drag')
             , event = d3.event
             , y = +container.attr('y')
             , offsety = event.offsetY  
             , dirdown = offsety > y ? true : false 
             , any = y +  ((dirdown === true ? 1 : -1) * (offsety - scrollerheight / 2))
             , ny = any < 0 ?  0 : any >= (height - scrollerheight) ? 
                              height - scrollerheight: any
             , nr = displayed(ny)
             ;
            
             scroller.attr('y', ny);
             renderer(domain.slice(nr, nr + numberrows));

         }
     }


     const scrolldisplay = (height, scrollerheight, displayed, renderer, domain, numberrows) => {

      function _dragOn(d){  
       
           let sel = d3.select(this)
           , event = d3.event 
           , y = +sel.attr('y')
           ,  yoff = event && event.dy || 0
           ,  ny = y + yoff 
           ,  r = displayed(y)
           ,  nr = displayed(ny)
         ;
         
         //console.log([y, yoff, ny, r, nr, ny + scrollerheight, height]);
         if(ny < 0 || (ny + scrollerheight - 1) > height) return;
         sel.attr('y', ny)
           .classed('hover', event != null)
           .attr('cursor', 'grabbing');

         renderer(domain.slice(nr, nr + numberrows));
       }
     
       function _dragEnd(d){
          d3.select(this)
            .classed('hover', false)
            .attr('cursor', 'grab');
       }

       return d3.drag()
       .on("start", _dragOn)
       .on("drag", _dragOn)
       .on("end", _dragEnd);           

     }

     const makelayers = (xvar, yvars, allowed, eventdefs, readonly, onclick, tooltip) => {
       const datestringify = d3.timeFormat('%Y-%m-%d')
       , lh = 15
       , linesoftext = d3.scaleThreshold().domain([15, 45]).range([0, 1, 2, 3])
       ;

       const baselayer =  (elem, xscale, yscale) => { //base layer 
       const datum = elem.datum();
       const {domain} = datum || {};

       let icellmousebehavior = cellmousebehavior(symbols.filter(d => /add/i.test(d.type))
                   , onclick, null) 
        , ch = domain[1] && yscale(domain[1]) - yscale(domain[0]) 
        ;


        elem.selectAll('g.day-band')
        .data(xscale.domain())
        .join('g').attr('class', 'day-band')
        .each(function(d){
           let dayband = d3.select(this)
           ,   xpos = xscale(d)
           ,   curr = datestringify(d)
           ,   isallowed = allowed == null || allowed.length == 0 || 
                                 allowed.filter(ad => ad === curr).length > 0
           ;
          
           dayband
              .classed('disable', !isallowed)
              .selectAll('g.time-cell')
              //coerce data to a consistent format with event object
              .data(domain.map(dd => Object.assign({},  {[xvar] : datestringify(d), [yvars[0]]: dd})))
              .join('g').attr('class', 'time-cell') 
               .each(function(cd){ 
                  d3.select(this)
                    .attr('transform', `translate(${[xpos, yscale(cd[yvars[0]])]})`)
                    .selectAll('rect')
                    .data([0])
                    .join('rect') 
                    .attr('width', xscale.bandwidth())
                    .attr('height', ch) 

                 if(!readonly && isallowed)
                   d3.select(this)
                     .call(icellmousebehavior);
              })
             ;
   
        });               
      }
      ;


       return [
           baselayer 
          , ...eventdefs.map(eventdef => {
               const {type, ops, events, z} = eventdef;
               return (elem, xscale, yscale) => {
                let yscaledomain = yscale.domain()
                , xscaledomain = xscale.domain()
                , xbounds = xscaledomain.filter((d, i) => i === 0 || i === xscaledomain.length - 1) 
                , ecellmousebehavior = cellmousebehavior(symbols.filter(d => ops.indexOf(d.type) >= 0)
                                                         , onclick, tooltip) 
                , zscale =  z && z.colorscheme &&  d3.scaleOrdinal(z.domain || events.map((d, i) => i)
                                           , z.colorscheme)
                ;
  
                elem.selectAll(`g.events.${type}`)
                  .data([//check event data is in bound
                    events.filter(e => (e[yvars[0]] >= yscaledomain[0] && e[yvars[0]] <= yscaledomain[1]) ||
                                      (e[yvars[1]] >= yscaledomain[0] && e[yvars[1]] <= yscaledomain[1]))
                          .filter(e => {
                            let ed = new Date(`${e[xvar]} 00:00:00`)
                            return ed >= xbounds[0] && ed <= xbounds[1];
                          })
                   ])
                  .join('g').attr('class', `events ${type}`)
                  .selectAll('g.event')
                  .data(d => d)
                  .join('g').attr('class', 'event')
                  .each(function(d, i){
                      let ed = new Date(`${d[xvar]} 00:00:00`)
                      ,   ew = xscale.bandwidth() * 0.8
                      ,   bclr = d.color || zscale && zscale(d[z.var || i])
                      ,   fclr = pickBestContrast(bclr, ['#fff', '#000'])
                      ,   h = yscale(d[yvars[1]]) - yscale(d[yvars[0]])
                      ,   txts = [d.name
                        , [d[yvars[0]], d[yvars[1]]].map(dd => formatters.time(dd)).join(' - ')
                      ]
                      ;
   
                  
                     d3.select(this)
                       .attr('transform', `translate(${[xscale(ed), yscale(d[yvars[0]])]})`)
                       .selectAll('rect')
                       .data([0])
                       .join('rect') 
                       .attr('height', h)
                       .attr('width', ew)
                       .attr('fill', bclr)
                    ; 

                   let hoff = lh;
                   d3.select(this)
                     .selectAll('text')
                     .data(txts.slice(0, linesoftext(h)))
                     .join('text')
                     .classed('title', (d, i) => i === 0)
                     .attr('fill', fclr)
                     .attr('dy', '0') 
                     .html(d => d)
                     .call(wrap, ew)
                     .attr('transform', function(d, i) {
                        let bb = this.getBBox()
                        ,   translate = `translate(2, ${hoff})`
                        ;
                        hoff += bb.height;
                        return translate;
                     })
                   ;
   
                  }) 
                  .call(ecellmousebehavior)   
                  ;
              } 
          }) 
      ]
     }


     const scrollableSection = (section, xscale, yscale, ytickformatter, margin, layers) => {

         return function(domain){
             let  yaxis = d3.axisLeft(yscale)
                          .tickSize(0)
                          .tickValues(domain.filter((d, i) => d % 60 === 0))
                          .tickFormat(ytickformatter) 
            
             ;

             yscale.domain(d3.extent(domain));

             //add y axis 
             section.selectAll('g.y.axis')
             .data([0])
             .join('g').attr('class', 'y axis')
             .attr('transform', `translate(${[margin.left, margin.top]})`)
             .call(yaxis)
             ;

             let plot = section.selectAll('g.plot')
             .data([{domain}])
             .join('g').attr('class', 'plot')
             .attr('transform', `translate(${[margin.left, margin.top]})`)
             ;
             
            layers.forEach(lyr => {
                  plot.call(lyr, xscale, yscale);
            })
            ;        
         }
     }

     const ttip = commons.tooltip();
   
     const cellmousebehavior = (symbols, onclick, tooltip) => {
           
          function mouseenter(d){
              let ovg = d3.select(this)
              ,   bbx = ovg.selectAll('rect').node().getBBox()
             ;
              
               ovg
                 .classed('hover', true)
                 .selectAll('use')
                 .data(symbols)
                 .join('use') 
                 .attr('x', bbx.width).attr('y', bbx.height)                   
                 .attr('href', dd => `#${dd.symbol}`)
                 .attr('data-op', dd => dd.type)
                 .attr('title', dd => dd.title);

              tt_mouseenter(d);
          }

          function mouseout(d){
              d3.select(this)
                .classed('hover', false)
                .selectAll('use').remove();

              tt_mouseout(d);
          }

          function _onclick(d){
             if(!onclick) return;
             let parentd = d3.select(this.parentNode).datum();
             onclick(Object.assign({}, {d:d}, {parentd}));
          }

          function tt_mouseenter(d){
            tooltip && ttip.content(tooltip(d))
            .showtip();
          }

          function tt_mouseout(d){
               ttip.hidetip();
          }

          return !symbols || symbols.length <= 0 ? function(sel) {
                //tooltip
                if(!tooltip) return 
                sel
                .style('cursor', 'default')
                .on("touchmove mousemove click", tt_mouseenter)
                .on("touchend mouseleave", tt_mouseout)

          } :  function(sel){
              //click
              sel
              .style('cursor', 'pointer')
              .on("touchmove mousemove", mouseenter)
              .on("touchend mouseleave", mouseout)
              .on("click", _onclick)
          }
     }


     const makeWeek = d => {
      let start = d3.timeWeek.floor(d)
      , end = d3.timeWeek.ceil(d3.timeDay.offset(d, 1))
      ;
      return [start, end];
     } 

     const clamptostep = (minutes, step) => {
      return (Math.round(minutes/ step) * step);
     }

      return chart;
  }
})