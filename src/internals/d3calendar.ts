

export const d3calendar = ((d3, commons) => {
    let {wrap} = commons;
    let defaults = {
        valueformatter: null
    };
    return (config) => {
        config = Object.assign(defaults, config);

        const cellSize = 25;
        const kyxvar = 'key_date';

        function chart(selection, opts?){
            opts = Object.assign({}, config, opts || {});

            selection.each(function(props){               
               draw(this, Object.assign({}, opts, props));            
            });

            return chart;
         }
         
         const draw = (elem, props) => {        
            let {title, data, width, margin, xvar, yvars, color, valueformatter, weekday} = props;

            data = data && JSON.parse(data);
            margin = margin && JSON.parse(margin);
            yvars = yvars && JSON.parse(yvars);
            //format to valid date - stringify messes the date property
            data && data.forEach(dt => {
                dt && dt.values.forEach(d => {
                    d[kyxvar] = new Date(d[xvar]);
                });
            });

            let height = _height(weekday);
            let countDay = _countDay(weekday);
            let timeWeek = _timeWeek(weekday);
            //let pathMonth = _pathMonth(weekday, null);
            let yVar = yvars[0];
            let tVar = yvars[1];
            let offset = d3.local();
            let pathMonth = d3.local();
            let container = d3.select(elem).selectAll('svg')                   
                            .data([{data: data, xVar: kyxvar}])
                            .join('svg')
                            .attr('class', 'chart')
                            .attr('width', width).attr('height', (margin.top + height + margin.bottom)  * data.length);
            let ttip = valueformatter && tooltip(); 
        
        
        
            container.selectAll('text.title')    
                    .data([title])
                    .join('text')
                    .attr('class', 'title')
                    .attr("x", (width / 2))             
                    .attr("y", margin.top)
                    .attr("text-anchor", "middle") 
                    .text(d => d);    
        
            const year = container.selectAll('g.year') 
                              .data(d => d.data)
                              .join('g').attr('class', 'year')
                              .attr('transform', (d, i) => `translate(${margin.left}, ${(margin.top + height * i + cellSize * 1.5)})`)
                              .each(d => {
        
                                  offset.set(this, dt => {
                                    return timeWeek.count(d3.utcMonth(d.values[0][kyxvar]), dt);
                                  });
        
                                  pathMonth.set(this, _pathMonth(weekday, d.values[0][kyxvar]));
                              });
        
            // year.selectAll('text')
            //     .data(d =>[d]).join('text')
            //     .attr('x', -10)
            //     .attr('y', 0)
            //     .attr('font-weight', 'bold')
            //     .attr('text-anchor', 'end')
            //     .text(d => d.key);
        
            year.selectAll('g.weekday')
                .data([0]).join('g').attr('class', 'weekday')
                .attr("text-anchor", "end")
                .selectAll("text")
                .data((weekday === "weekday" ? d3.range(2, 7) : d3.range(7)).map(i => new Date(1995, 0, i)))
                .join("text")
                .attr("x", -10)
                .attr("y", d => (countDay(d) + 0.5) * cellSize)
                .attr("dy", "0.31em")
                .text(formatDay);
            
            const cells = year.selectAll('g.grid')
                .data(d => [d]).join('g').attr('class', 'grid')
                .selectAll("g.cell")
                .data(d => {                
                   
                    var extent = d3.extent(d.values.map(dd => d3.timeDay.round(dd[kyxvar])));
                    var t = d3.timeDay.range(d3.timeDay.floor(extent[0]), d3.timeDay.offset(d3.timeDay.ceil(extent[1])));
           
        
                    return t.map(tt => { 
                        var mtt = d.values.filter(dd => areequal(dd[kyxvar],  tt));               
                        return mtt.length > 0 ? mtt[0] 
                                    : {[kyxvar]: tt, [xvar]: tt, [yVar]: null};
                    });
                 
                })
                .join('g').attr('class', 'cell')
                .selectAll('rect')
                .data(d => [d])
                .join("rect")        
                .attr("width", cellSize - 1)
                .attr("height", cellSize - 1)
                .attr("x", d =>  offset.get(this)(d[kyxvar]) * cellSize + 0.5)  //timeWeek.count(d3.utcYear(d[xVar]), d[xVar])
                .attr("y", d => countDay(d[kyxvar]) * cellSize + 0.5)  
                .attr('fill',  d => color(d[yVar], d[tVar])) 


            valueformatter && cells.on('touchmove mousemove', d => {
                ttip.content(valueformatter(d)).showtip();
            })
            .on('touchend mouseleave', () => ttip.hidetip()) 
            ;  
        
            const month =  year.selectAll('g.month')
                .data(d => [d]).join('g').attr('class', 'month')
                .selectAll("g")
                .data(d => d3.utcMonths(d3.utcMonth(d.values[0][kyxvar]), d.values[d.values.length - 1][kyxvar]))
                .join("g").attr('class', 'month');
        
            month.filter((d, i) => i).append("path")
            .attr("fill", "none")
            .attr("stroke", "#fff")
            .attr("stroke-width", 3)
            .attr("d", d => pathMonth.get(this)(d));
        
            month.append("text")
                .attr("x", d =>  offset.get(this)(timeWeek.ceil(d)) * cellSize + 2) //timeWeek.count(d3.utcYear(d), timeWeek.ceil(d))
                .attr("y", -5)
                .text(formatMonth); 

            return chart;
         }

         const _height = (weekday) => cellSize * (weekday === 'weekday' ? 7 : 9);
         const _timeWeek = (weekday) => weekday === 'sunday' ? d3.utcSunday : d3.utcMonday;
         const _countDay = (weekday) => weekday === 'sunday' ? d => d.getUTCDay() : 
                                               d => (d.getUTCDay() + 6) % 7;
         
         const formatDay = d => ['Sun','Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
         const formatMonth = d3.utcFormat('%b');
         const _pathMonth =  (weekday, start) => {
             const n = weekday === 'weekday' ? 5 : 7;
             const countDay = _countDay(weekday);
             const timeWeek = _timeWeek(weekday);
             
             return (t) => {
                 const startdate = start ? d3.utcMonth(start) : d3.utcYear(t);
                 const d = Math.max(0, Math.min(n, countDay(t)));
                 const w = timeWeek.count(startdate, t);
                 return `${d === 0 ? `M${w * cellSize},0`
                 : d === n ? `M${(w + 1) * cellSize},0`
                 : `M${(w + 1) * cellSize},0V${d * cellSize}H${w * cellSize}`}V${n * cellSize}`;
             }
         }

         const areequal = (date1, date2) => {
         
             return d3.timeDay.round(date1).toISOString().split('T')[0] === 
                              d3.timeDay.round(date2).toISOString().split('T')[0];
         }

         
         const tooltip = () => {
            var _t = d3.select('body')
                       .selectAll('div.viz.tooltip')
                       .data([0]).join('div').attr('class', 'viz tooltip')
              , timer;
              _t.selectAll('div.tooltip-inner')
                .data([0]).join('div').attr('class', 'tooltip-inner');
      
            var tip =  {
                hidetip: () => { 
                    _t.transition().duration('500').style('opacity', 0);              
                    window.clearTimeout(timer);
                    timer = window.setTimeout(function(){
                      if(_t.node().style.opacity < 0.9)
                         _t.classed('d-none', true);
                    }, 500)
                   return tip;
                }
                , showtip: () => {
                    _t.classed('d-none', false)
                      .style('left', (d3.event.pageX + 28) + 'px')
                      .style('top', (d3.event.pageY) + 'px')
                    _t.transition().delay(200).style('opacity', 0.9)
                   return tip;
                }
                , content: (html) => {
                   _t.selectAll('div.tooltip-inner')
                     .data([html])
                     .join('div').attr('class', 'tooltip-inner')
                     .html(function(d){return d;});
                   return tip;
                }
            };
      
            return tip;
        }

         return chart;
    }
})