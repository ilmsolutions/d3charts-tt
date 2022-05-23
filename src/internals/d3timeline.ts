export const d3timeline = ((d3, commons) => {
    const {wrap, collisiondetection} = commons;
    let defaults = {
     jsdom: false
    };  
    
    return (config => {
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
                , xvar, yvars, color : defaultColor, valueformatter
                , onclick, colorgen 
                , tooltip: ttdisplay      
            } = props; 
  
            data = data && JSON.parse(data);
            margin = margin && JSON.parse(margin);
            width = width || elem.getBoundingClientRect().width;
            height = height || elem.getBoundingClientRect().height;
            yvars = yvars && yvars.split(',');


            //parse dates 
            let _xvar = `prs_${xvar}` 
            , rdata = data.map(d => {
              return Object.assign({}, d, {[_xvar] : Date.parse(d[xvar])}); 
            });

            let x =  d3.scaleTime()
                         .domain(d3.extent(rdata, d => d[_xvar]))     
                         .range([margin.left, width - margin.right]);
            
            let y = d3.scaleLinear()
                      .domain([0, d3.max(rdata, d => {
                          return d3.max(yvars.map(yvar => {
                              return d[yvar];
                          }));
                      })]).nice()
                      .range([height - margin.bottom, margin.top]);
          

            let xAxis = g => g.attr('transform', `translate(0, ${height - margin.bottom})`)
                              .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));
              
            let yAxis = g => g.attr('transform', `translate(${margin.left}, 0)`)
                              .call(d3.axisLeft(y).tickFormat(d3.format('d')))
                              .call(g => g.select('.domain').remove())
                              .call(g => g.select('.tick:last-of-type text').clone()
                                          .attr('x', 3)
                                          .attr('text-anchor', 'start')
                                          .attr('font-weight', 'bold'));
          
            let chart = d3.select(elem).selectAll('svg')
                          .data([{x: x, y: y, data: rdata, xVar: _xvar}]).enter().append('svg')
                          .attr('class', 'chart')
                          .attr('width', width).attr('height', height);
          
            let bisector = bisect({xVar: _xvar, x: x, data: rdata});
          
            chart.selectAll('.title')    
                 .data([title])
                 .enter().append('text')
                 .attr('class', 'title')
                 .attr("x", (width / 2))             
                 .attr("y", (margin.top / 2))
                 .attr("text-anchor", "middle") 
                 .text(d => d);
          
            chart.append('g').attr('class', 'x axis').call(xAxis)
          
            chart.append('g').attr('class', 'y axis').call(yAxis)
          
            let plot = chart.selectAll('g.plot')
                            .data([null]).enter().append('g')
                            .attr('class', 'plot');
          
            plot.selectAll('g.line')
                .data(yvars).enter().append('g')
                .attr('class', 'line')
                .each((yvar, i, n) => {
                  let line = d3.line()
                  .defined(d => !isNaN(d[yvar]))
                  .x(d => x(d[_xvar]))
                  .y(d => y(d[yvar]))
                  .curve(d3.curveMonotoneX);          
          
                  d3.select(n[i]).attr('class', `${yvar}`)
                      .append('path')
                      .datum(rdata)
                      .attr("fill", "none")       
                      .attr("stroke-width", 1.5)
                      .attr("stroke-linejoin", "round")
                      .attr("stroke-linecap", "round")
                      .attr("d", line);  
                });
          
             chart.selectAll('text.line-label')
                .data(yvars).enter().append('text')
                .attr('class', 'line-label')
                .each((yvar, i, n) => {
                     d3.select(n[i]).datum(rdata[rdata.length - 1])
                      .classed(`${yvar}`, true)
                      .text(d => `${yvar} ${valueformatter(d[yvar])}`)
                      .attr('transform', d => `translate(${x(d[_xvar])}, ${y(d[yvar])})`)
                      .attr('x', 0).attr('y', 0)
                      .attr('alignment-baseline', 'middle')
                      .attr('dx', '0.5em')
                      .attr('dy', '0.9em')
                      .call(wrap, margin.right)      
                });
          
                const tooltip = chart.selectAll('g.tool-tip')
                                   .data([
                                    { width: width - margin.left - margin.right 
                                    , height: height - margin.top - margin.bottom}
                                    ]).join('g')
                                   .attr('class', 'tool-tip');
          
                const overlay = plot.append('rect').attr('class', 'over-lay')
                       .attr('fill', 'none')
                       .attr('pointer-events', 'all')
                       .attr('width', width)
                       .attr('height', height);
          
                overlay.on('touchmove mousemove', function(){          
                    let d = bisector(d3.mouse(this)[0]);
                    let xoff = x(d[_xvar]);
                    tooltip
                       .attr('data-xoff', `${xoff}`)
                       .attr('transform', `translate(${xoff}, ${margin.top})`)
                       .call(callout, ttdisplay(d));
                });

                onclick && overlay.on('click', function(){
                  let d = bisector(d3.mouse(this)[0]);
                  onclick(d);
                });
              
                overlay.on('touchend mouseleave', () => tooltip.call(callout, null));

             return chart;
         }

         
        const bisect = ({data, xVar, x}) => {      
            const bisect = d3.bisector(d => d[xVar]).left;
        
            
            return mx => {
                const xval = x.invert(mx)   ;
                
                const index = bisect(data, xval, 1);         
                const a = data[index-1];
                const b = data[index];
                return !b ? a : !a ? b : 
                            xval - a[xVar] > b[xVar] - xval ? b : a;
            };
        }


         const callout = (g, value) => {
            if (!value) return g.style("display", "none");
           
            const {height, width} = g.datum();
            const xoff = +g.attr('data-xoff');
            g
                .style("display", null)
                .style("pointer-events", "all")
                .style("font", "10px sans-serif");
          
        
        
            g.selectAll('line')
                .data([null])
                .join('line')
                .attr('x1', 0).attr('x2', 0)
                .attr('y1', 0).attr('y2', height)
                .attr('fill', 'white')
                .attr('stroke', 'black');
        
            const gtext = g.selectAll('g.text-box')
                             .data([null]).join('g')
                             .attr('class', 'text-box');
                             
        
            const path = gtext.selectAll("path")
              .data([null])
              .join("path");
          
            const text = gtext.selectAll("text")
              .data([null])
              .join("text")
              .call(text => text
                .selectAll("tspan")
                .data((value + "").split(/\n/))
                .join("tspan")
                  .attr("x", 0)
                  .attr("y", (d, i) => `${i * 1.25}em`)
                  .style('font-size', '1.2em')
                  .style("font-weight", (_, i) => i ? null : "bold")
                  .text(d => d.trim()));
          
            const {x, y, width: w, height: h} = text.node().getBBox();
        
            //orientation
            if(xoff + w + 20 + 5 > width){
              //orientation switches to left
              text.attr('transform', `translate(15, 15)`);
              path.attr('d', `M0,${h + 20}V0H${w + 20}V${h / 2 + 10}L${w + 25},${h / 2 + 15}L${w + 20},${h / 2 + 20}V${h + 20}Z`);
              gtext.attr('transform', `translate(${-(w + 25)}, ${(height - h - 20)/ 2})`);
            }
            else{
              text.attr('transform', `translate(10, 5)`);
              path.attr('d', `M0,${h / 2 + 10}L-5,${h / 2 + 5}L0,${h / 2}V0,${-h / 2}H${w + 20}V${h + 20}H0Z`);  
              gtext
              .attr('transform', `translate(5, ${(height - h - 20) / 2})`);
            }
        
          }
        return chart;
    })
})