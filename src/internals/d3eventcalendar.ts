export const d3eventcalendar = ((d3, commons) => {
    let {wrap} = commons;
    let defaults = {
        valueformatter: null
     ,  onclick: null
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

        const draw = (elem, props) => {
            let {title, data, startofmonth, height, width, margin, yvar, customsymbols, onclick} = props;
            data = data && JSON.parse(data);
            margin = margin && JSON.parse(margin); 
            width = width || elem.clientWidth;
            height = height || elem.clientHeight;
           
            let ddata = data && data.map(d => Object.assign({}, d, 
                                {date: new Date(`${d[yvar]} 00:00:00.0`)}));   

            let container = d3.select(elem).selectAll('svg')                   
                            .data([{date: new Date(`${startofmonth} 00:00:00.0`)}])
                            .join('svg')
                            .attr('class', 'chart')
                            .attr('width', width)
                            .attr('height', (margin.top + height + margin.bottom))
                            ;            

            
            container.selectAll('text.title')    
                            .data([title])
                            .join('text')
                            .attr('class', 'title')
                            .attr("x", (width / 2))             
                            .attr("y", margin.top)
                            .attr("text-anchor", "middle") 
                            .text(d => d);  

            container.call(
                width >= 600 ? eventCalendarLarge : eventCalendarSmall
                , props, {width, height, ddata}
            )
            .selectAll('g.day').filter(function(){
                return !this.classList.contains('disabled');
            })
            .on('click', onclick);

        }

        const eventCalendarLarge = (elem, props, cprops) => {
            let {xvar, customsymbols} = props;
            let {ddata, height, width} = cprops;
            let lprops = {offsetx: 10, offsety: 0.1, offsettop: 25, offsetright: 25};
            let headerheight = 50;       

            let columns = d3.scaleBand().domain(d3.range(0, 7)).range([0, width])
                            .paddingInner(0.01);
            let rows = d3.scaleBand().domain(d3.range(0, 6)).range([0, height - headerheight])
                            .paddingInner(0.01);

            let month = elem.selectAll('g.month')            
                     .data(d => [makemonth(d.date)])
                     .join('g').attr('class', 'month');

            month.selectAll('g.head')
                 .data(d => d.filter(dd => dd.row == 0))
                 .join('g').attr('class', 'head')
                 .attr('transform', d => `translate(${columns(d.col)}, 0)`)
                 .each(function(d){
                     var h = headerheight - 10;
                     d3.select(this)
                       .selectAll('rect')
                       .data([0])
                       .join('rect')
                       .attr('width', columns.bandwidth())
                       .attr('height', h);

                    d3.select(this)
                      .selectAll('text')
                      .data([0])
                      .join('text')
                      .attr('text-anchor', 'middle')
                      .attr('x', columns.bandwidth() / 2)
                      .attr('y', h / 2)
                      .attr('dominant-baseline', 'middle')
                      .text(weekdays[d.date.getDay()]);
                 });

            month.selectAll('g.day')
                     .data(d => d)
                     .join('g').attr('class', 'day')
                     .attr('transform', d => `translate(${columns(d.col)}, ${headerheight + rows(d.row)})`) 
                     .classed('out', d => d.out)                  
                     .each(function(d){
                        d3.select(this)
                          .selectAll('rect')
                          .data([0])
                          .join('rect')                            
                            .attr('width', columns.bandwidth())
                            .attr('height', rows.bandwidth());
                        
                        d3.select(this)
                          .selectAll('text.number')
                          .data([0])
                          .join('text').attr('class', 'number')                          
                          .attr('text-anchor', 'start')
                          .attr('x', columns.bandwidth() - lprops.offsetright)
                          .attr('y', lprops.offsettop)
                          .text(d.date.getDate());
 
                      
                        if(ddata){
                            var dd = ddata.filter(dd => dd.date.getTime() == d.date.getTime());

                            customsymbols && d3.select(this)
                            .selectAll('use')
                            .data(dd.map(ddd => customsymbols(ddd)).filter(ddd => ddd))
                            .join('use').attr('xlink:href', ddd => `#${ddd.symbol}`)
                            .filter(ddd => ddd.title)
                            .each(function(ddd){
                                d3.select(this)
                                  .selectAll('title')
                                  .data([ddd.title])
                                  .join('title').text(dddd => dddd);
                            })
                          ;

                            d3.select(this)
                            .classed('disabled', dd.length <= 0)
                            .selectAll('text.label')
                            .data(dd.filter(ddd => ddd[xvar]))
                            .join('text')
                            .attr('class', 'label')
                            .attr('dy', lprops.offsety)
                            .html(dd => dd[xvar])
                            .call(wrap, columns.bandwidth() - 2 * lprops.offsetx)
                            .attr('transform', d => `translate(${lprops.offsetx}, ${lprops.offsettop})`)
                            .attr('dominant-baseline', 'hanging');
                        } 

                     })
                     .on('touchmove mousemove', function(d){
                        d3.select(this).classed('hover', true)
                     }).on('touchend mouseleave', function(d){
                        d3.select(this).classed('hover', false);
                     });

            return elem;

        }

        const eventCalendarSmall = (elem, props, cprops) => {
            let {xvar, customsymbols} = props;
            let {ddata, height, width} = cprops;
            const rows = d3.scaleBand().domain(d3.range(0, 31)).range([0, height])
                           .paddingInner(0.1);
            const dholder = {width: width * 0.2, lineheight: (rows.bandwidth() / 2), top: 10};
            const cols = [{width: dholder.width, offset: 0, ioffset: 0}, {width: width - dholder.width - 3.5, offset: dholder.width + 3.5, ioffset: 10, dy: 0.1}];

            elem.classed('mobile', true);

            let month = elem.selectAll('g.month')            
                     .data(d => [makemonth(d.date)])
                     .join('g').attr('class', 'month'); 

            month.selectAll('g.day')
                .data(d => d.filter(dd => !dd.out))
                .join('g').attr('class', 'day')
                .attr('transform', (d, i) => `translate(0, ${rows(i)})`)
                .each(function(d) {
                    
                    d3.select(this)
                    .selectAll('rect')
                    .data(cols)
                    .join('rect').attr('width', d => d.width)
                    .attr('transform', d => `translate(${d.offset}, 0)`)
                    .attr('height', rows.bandwidth())
                    ;
            
                d3.select(this)
                    .selectAll('text.number')
                    .data([0])
                    .join('text').attr('class', 'number')
                    .attr('transform', `translate(${dholder.width / 2}, ${dholder.top})`)
                    .attr('text-anchor', 'middle')
                    .html(d.date.getDate())
                    .attr('dominant-baseline', 'hanging');
            
                d3.select(this)
                    .selectAll('text.weekday')
                    .data([0])
                    .join('text').attr('class', 'weekday')
                    .attr('transform', `translate(${dholder.width / 2}, ${dholder.lineheight + dholder.top})`)
                    .attr('text-anchor', 'middle')
                    .attr('dy', '-0.35em')
                    .html(abbrWeekDays[d.date.getDay()])
                    .attr('dominant-baseline', 'hanging');  

                if(ddata){
                    var dd = ddata.filter(dd => dd.date.getTime() == d.date.getTime());

                    customsymbols && d3.select(this)
                    .selectAll('use')
                    .data(dd.map(ddd => customsymbols(ddd)).filter(ddd => ddd))
                    .join('use').attr('xlink:href', ddd => `#${ddd.symbol}`) 
                    .filter(ddd => ddd.title)
                    .each(function(ddd){
                        d3.select(this)
                          .selectAll('title')
                          .data([ddd.title])
                          .join('title').text(dddd => dddd);
                    })
                  ;

                    d3.select(this)
                    .classed('disabled', dd.length <= 0)
                    .selectAll('text.label')
                    .data(dd.filter(ddd => ddd[xvar]))
                    .join('text')
                    .attr('class', 'label')  
                    .attr('dy', cols[1].dy)                 
                    .html(ddd => ddd[xvar])                    
                    .call(wrap, cols[1].width - 2 * cols[1].ioffset)
                    .attr('transform', d => `translate(${cols[1].offset + cols[1].ioffset}, ${dholder.top})`)
                    .attr('dominant-baseline', 'hanging');
                } 

                d3.select(this)
                    .on('touchmove mousemove', function(d){
                    d3.select(this).classed('hover', true)
                }).on('touchend mouseleave', function(d){
                    d3.select(this).classed('hover', false);
                });
            });

            return elem;
        }

        const makemonth = (d) => {
            const start = d3.timeMonth.floor(d);
            const end = d3.timeMonth.ceil(d3.timeDay.offset(d, 1));
            const startday = start.getDay();   
            const endday = end.getDay();
            const days = d3.timeDay.count(start, end);
    
            return [].concat.apply([], [
              startday && d3.timeDay.range(d3.timeDay.offset(start, -startday), start) || []
              , d3.timeDay.range(start, end)
              , endday && d3.timeDay.range(end, d3.timeDay.offset(end, (7 - endday))) || []
              ])      
              .map(dd => {
                  return {
                          date: dd, col: dd.getDay(),                      
                          row:  Math.floor( dd < start ? 0 : dd >= end 
                                                 ? (dd.getDate() - 1 + startday + days) / 7 :
                                                     (dd.getDate() - 1 + startday) / 7),
                          out: dd < start || dd >= end
                         };
              });    
        }      

        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const abbrWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
        return chart;
    }


})