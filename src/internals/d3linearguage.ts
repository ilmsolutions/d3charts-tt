export const d3linearguage = ((d3, commons) => {
  const {wrap, collisiondetection, rounded_rect, horizontalscaleColorGen, pickBestContrast} = commons;
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
          let {title, data, width, height, margin, selected
              ,points, series, colorscheme, type, valueformatter 
              ,value ,layers, interpolatetype, tooltip, range, labels  
              , config  
         } = props;
     
         let opacity = d => selected && d.name !== selected ? 0.5 : 1;
 
         data = data && JSON.parse(data);
         margin = margin && JSON.parse(margin);
         range = range && JSON.parse(range).map(d => +d);
         series = series && JSON.parse(series);
         points = points && JSON.parse(points);
         labels = labels && JSON.parse(labels);
         config = config && JSON.parse(config);

         width = width || elem.getBoundingClientRect().width;
         height = height || elem.getBoundingClientRect().height;
         
         let color = colorscheme && d3.scaleOrdinal().domain(series).range(colorscheme.split(','));

         let svg = d3.select(elem).selectAll('svg.chart')                   
         .data([{data: data}])
         .join('svg').attr('class', 'chart')
         .attr('width', width).attr('height', height)               
          , ch = height - margin.top - margin.bottom 
          , cw = width - margin.left - margin.right
          , tw = Math.min(cw, ch) / 2; 

          title && svg.selectAll('g.title')                
          .data([[title]])
          .join('g').attr('class', 'title')
          .selectAll('text').data(d => d)
          .join('text').attr('text-anchor', 'middle')
          .attr('dy', '.35em')
          .html(d => d)
          .call(wrap, tw * 0.2)
          .each(function(d) {
              var bb = this.getBBox();
              d3.select(this).attr('transform', `translate(${[0, -(bb.height / 3)]})`)
          })
          ;   

          //no-data check
          if(!data) return;

          let stack = d3.stack()
                     .keys(series)
                    //.order(d3.stackOrderNone)
                    .offset(d3.stackOffsetDiverging)
          ,  scale = d3.scaleLinear()
                       .domain(range)
                       .range([0, cw])
          ,  s = [stack(data)]
          ,  band = d3.scaleBand()
                   .domain(s.map((d, i) => i))
                   .range([0, ch])
          ,  r = band.bandwidth() / 3  
          ;

          svg.selectAll('g.plot')
             .data(s)
             .join('g').attr('class', 'plot')
             .attr('transform', d => `translate(${margin.top}, ${margin.left})`)
             .selectAll('g.band')
             .data(d => [d])
             .join('g').attr('class', 'band')
             .attr('transform', (d, i) => `translate(0, ${band(i)})`)
             .each(function(d){  
                 let _d = d.filter(dd => dd[0][1] !== dd[0][0]);
                 d3.select(this)
                   .selectAll('g.segment')
                   .data(_d)
                   .join('g').attr('class', 'segment')
                   .attr('transform', (dd) => `translate(${scale(dd[0][0])}, 0)`)
                   .each(function(dd, ddi){ 
                        
                        let w = scale(dd[0][1]) - scale(dd[0][0])
                        ,   h = band.bandwidth()
                        ;
                        d3.select(this)
                          .selectAll('path')
                          .data([0])
                          .join('path')
                          .attr("d", ddd => {
                             let tl = ddi == 0 
                             ,   bl = ddi == 0 
                            ,   tr = ddi == _d.length - 1 
                             ,   br = ddi == _d.length - 1 
                             ; 

                             return rounded_rect(0, 0, w, h, 10,  tl, tr, bl, br);
                          }) 
                          .attr('fill', color(dd.key))
                          ;
                   })
                   
             });

             config && config.showlegend && svg.selectAll('g.legend')
                .data(s)
                .join('g').attr('class', 'legend')
                .attr('transform', `translate(${margin.left}, ${margin.top + ch})`)
                .each(function(d){ 
                        let tw = 0, th;
                        d3.select(this)
                          .selectAll('g.item')
                          .data(d)
                          .join('g').attr('class', 'item')
                          .each(function(dd){

                              let txt = d3.select(this)
                                .selectAll('text')
                                .data([0])
                                .join('text')
                                .attr('transform', `translate(25, 0)`)
                                .text(`${labels[dd.key]}: ${valueformatter(dd[0].data[dd.key])}`)
                              , bbx = this.getBBox()
                              ;

                              d3.select(this)
                                .selectAll('path')
                                .data([0])
                                .join('path')
                                .attr('transform', `translate(0, ${-bbx.height})`)
                                .attr('d', rounded_rect(0, 0, 20, bbx.height, 2, true, true, true, true))
                                .attr('fill', color(dd.key));

                                
                              if(bbx.width > tw)  
                                  tw = bbx.width;

                              th = bbx.height; 
                          });

                      let itemperline = Math.floor(cw / tw)
                      , legx = d3.scaleBand()
                                  .domain(Array.from({length: itemperline}, (v, i) => i))
                                  .range([0, cw])
                      , legy = d3.scaleBand()
                              .domain(Array.from({length: Math.ceil(d.length / itemperline) }, (v, i) => i))
                              .range([th, margin.bottom + th])
                              .paddingInner(0.1).paddingOuter(0.25)
                      , dy = 0, dx = 0
                      ; 

                      d3.select(this)
                        .selectAll('g.item')
                        .attr('transform', function(dd, di){

                              if(di > 0 && dx < itemperline)
                                dx++;

                             if(dx >= itemperline){
                                dy++;
                                dx = 0;
                             }

                             return `translate(${legx(dx)}, ${legy(dy)})`;
                        }); 
                })


       };  
       
       return chart;
  }
});