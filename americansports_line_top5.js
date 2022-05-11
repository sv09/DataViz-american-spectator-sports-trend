//required dimensions
var margin = { top:20, right:50, bottom:20, left:50 };
const height = 550 - margin.top - margin.bottom;
const width = 800 - margin.left - margin.right;


d3.csv("./american_sports.csv")
    .then(d => 
        {   
            //DATA MANIPULATION - Convert string numbers to int; sort data in decsending order by 2017 value; filter top 5 data 
            
            //extract the YEAR column names
            let columns = d.columns.slice(1);
            
            //get the starting and the ending year from the period (for calculating % change)
            let period = [];
            period.push(columns[0]);
            period.push(columns[columns.length-1]);
            period.reverse(); // to maintain the chronological order
           
            //convert string numbers to int
            d.forEach(function(data) {          
                Object.keys(data).forEach(function(key) {
                    if(columns.includes(key)){
                        data[key] = +data[key];
                    }
                });
              })
            
            //sort by 2017 value and extract top 5 rows
            d = d.slice().sort((e1,e2) => d3.descending(e1['2017'], e2['2017'])).slice(0,5);
            
            //arrange data as required for visualization
            let data = {
                value: d.map(d => ({
                    sport: d.Sport,  //OR d['Sport']
                    liked: columns.map(col => +d[col])
                })),
                date: columns.map(d3.utcParse('%Y'))
            }

            //% change calculated between years 2004 and 2017
            const diff_data = {
                value: d.map(d => ({
                    sport: d.Sport,
                    perc_change: Math.round((((d[period[1]]-d[period[0]])/d[period[0]])*100) + Number.EPSILON*100/100)
                }))
            }

            //merge the two datasets
            let merge_data = [];
            data.value.forEach((obj,idx) => {
                merge_data.push(Object.assign(obj, diff_data.value[idx]));
            })

            // console.log(merge_data)

            //adjustment values for displaying elements on svg
            const threshold = 10;
            const adjustment = 20;
            const gap = 50;

            //define color palette for each sport
            const colorPalette = ['#f67e7d','#eb6841','#4f372d','#edc951','#00a0b0']
            let sportsName = [];
            merge_data.forEach(val => sportsName.push(val.sport))

            //add a SVG to the <div>
            const svg = d3.select('.svg-container')
                                .append('svg')
                                .attr('width', width + margin.left + margin.right)
                                .attr('height', height + margin.top + margin.bottom);

            //define a date scale for x-axis
            const xScale = d3.scaleUtc()
                                .domain(d3.extent(data.date))
                                .range([margin.left+threshold, width-margin.right]); 
            
            //define x-axis on the bottom of the svg and call the scale                    
            const xAxis = d3.axisBottom(xScale)
                            .ticks(width/80);

            //define color scale
            const colorScale = d3.scaleOrdinal()
                                .range(colorPalette)
                                .domain(sportsName);

            //call the x-axis on the svg             
            svg.append('g')
                .attr('class', 'x-axis')
                .call(xAxis)
                .attr('transform', `translate(0, ${height-margin.bottom-gap})`);

            //define a linear scale for y-axis    
            const yScale = d3.scaleLinear()
                                .domain([0, d3.max(data.value, d => d3.max(d.liked)+threshold)]) //d3.min(data.value, d => d3.min(d.liked))
                                .range([height-margin.bottom-gap, margin.top]);
            
            //define the y-axis on the left of the svg and call the scale
            const yAxis = d3.axisLeft(yScale).ticks(5);

            //call the y-axis on the svg
            svg.append('g')
                .attr('class', 'y-axis')
                .call(yAxis)
                .attr('transform', `translate(${margin.left-threshold}, 0)`)
                .call(g => g.select(".domain").remove());

            //function for defining the path for the lines     
            const lines = d3.line()
                            .x((d,i) => xScale(data.date[i]))
                            .y(d => yScale(d))

            //define and call the line svg                 
            svg.selectAll('.line')
                .data(data.value)
                .join('path')
                .attr('class', 'line')
                .attr('d', d => lines(d.liked))
                .attr('fill', 'none')
                // .attr('stroke', '#EAD220')
                .attr('stroke', d => colorScale(d.sport))
                .attr('stroke-width', '2')
            
            //data for displaying dots on the lines    
            let dot_entry = [];
            const s = data.value;
            s.forEach( entry => {
                let sport = entry.sport
                dot = entry.liked.map((val, idx) => {
                        return [ val, data.date[idx], sport ]
                    })
                dot_entry.push(dot);
            })
            const dot_data = d3.merge(dot_entry);
            // console.log(dot_data)

            //call the  circle svg to define dots on the lines
            svg.selectAll('.dots')
                .data(dot_data)
                .join('circle')
                .attr('class', 'dots')
                .attr('r', '3')
                .attr('cx', d => xScale(d[1]))
                .attr('cy', d => yScale(d[0]))
                // .attr('fill', '#EAD220')
                .attr('fill', d => colorScale(d[2]))

            //text svg for labelling each line     
            svg.selectAll('.sport-label')
                .data(d)
                .join('text')
                .attr('class', 'sport-label')
                .attr('y', d => yScale(d['2017']))
                .attr('font-family', 'sans-serif')
                .attr('font-size', 13)
                .text(d => d.Sport)
                .attr('transform', `translate(${width-margin.right+8}, 4)`)

            //text svg for adding % change values    
            svg.selectAll('.perc-change')
                .data(merge_data)
                .join('text')
                .attr('class', 'perc-change')
                .attr('y', d => yScale(d.liked[0]))
                .attr('font-family', 'sans-serif')
                .attr('font-size', 12)
                .text(d => `${Math.abs(d.perc_change)}%`)
                .attr('transform', `translate(${width+gap}, 4)`)
            
            //functions for providing positions for the placement of the arrow images    
            const up_arrow_pos = (val) => {
                if(val.perc_change *- 1 !== Math.abs(val.perc_change)){
                    return yScale(val.liked[0]);
                }
            }

            const down_arrow_pos = (val) => {
                if(val.perc_change *- 1 === Math.abs(val.perc_change) && val.perc_change !== 0){
                    return yScale(val.liked[0]);
                }
            }

            //image svg
            svg.selectAll('.up-arrows')
                .data(merge_data)
                .join('image')
                .attr('class', 'up-arrows')
                .attr('xlink:href', '../img/up-arrow-30.png')
                .attr('width', 50)
                .attr('height', 13)
                .attr('y', d => up_arrow_pos(d))
                .attr('transform', `translate(${width-adjustment+gap-threshold}, -7)`)
            
            svg.selectAll('.down-arrows')
                .data(merge_data)
                .join('image')
                .attr('class', 'down-arrows')
                .attr('xlink:href', '../img/down-arrow-30.png')
                .attr('width', 50)
                .attr('height', 13)
                .attr('y', d => down_arrow_pos(d))
                .attr('transform', `translate(${width-adjustment+gap-threshold}, -8)`)

            //text svg for adding y-axis label
            const yAxis_label = '% liked'
            svg.selectAll('.yAxis-label')
                .data([data])
                .join('text')
                .attr('class', '.yAxis-label')
                .attr('font-family', 'sans-serif')
                .attr('font-size', 12)
                .text(yAxis_label)
                .attr('transform', `translate(0, ${margin.top})`) //${margin.left}

            //text svg    
            const perc_change = '% change since 2004'
            svg.selectAll('.perc-change-text')
                .data([data])
                .join('text')
                .attr('class', '.perc-change-text')
                .attr('font-family', 'sans-serif')
                .attr('font-size', 12)
                .text(perc_change)
                .attr('transform', `translate(${width-margin.right+threshold+adjustment}, ${margin.top})`)

                
                
            // svg.selectAll('.dot-label')
            //     .data(dot_data)
            //     .join('text')
            //     .attr('class', 'dot-label')
            //     .attr('x', d => xScale(d[1])-5)
            //     .attr('y', d => yScale(d[0])+15)
            //     .attr('font-family', 'sans-serif')
            //     .attr('font-size', 12)
            //     .text(d => `${d[0]}%`)

            //text svg for the adding a title for the chart    
            // const title = "Change in America's favorite spectator sport"
            // svg.selectAll('.title')
            //     .data([data])
            //     .join('text')
            //     .attr('class', 'title')
            //     .attr('font-family', 'sans-serif')
            //     .attr('font-size', 36)
            //     .text(title)
            //     .attr('stroke', '#222')
            //     .attr('fill', '#222')
            //     .attr('transform', `translate(${margin.left-70}, 50)`)
            
            // const para = "Football has been the most popular spectator sport for the Americans for a over a decade now, but, the poplarity of Soccer has been soaring significantly. Interestingly, the number of people who don't watch any sport is also rising.";
            // svg.append('div')
            //     .attr('class', 'para-text')
            //     .attr('font-family', 'sans-serif')
            //     .attr('font-size', 15)
            //     .text(para)
            //     .attr('fill', '#333')
            //     .attr('transform', `translate(${margin.left-gap-threshold}, ${margin.top-gap+threshold})`)
            
            // svg.selectAll('.para-text')
            //     .data([data])
            //     .join('text')
            //     .attr('class', 'para-text')
            //     .attr('font-family', 'sans-serif')
            //     .attr('font-size', 15)
            //     .text(para)
            //     .attr('fill', '#333')
            //     .attr('transform', `translate(${margin.left-gap-threshold}, ${margin.top-gap+threshold})`)
            
            //text svg for footnotes    
            // const source = "Source: data.world (MakeOverMonday 2020 week1) | Original data from Gallup"
            // svg.selectAll('.source-text')
            //     .data([data])
            //     .join('text')
            //     .attr('class', 'source-text')
            //     .attr('font-family', 'sans-serif')
            //     .attr('font-size', 12)
            //     .text(source)
            //     .attr('fill', '#aaa')
            //     .attr('transform', `translate(${margin.left-30}, ${height-margin.bottom})`)

            // const footnote = 'Note: Data between years 2008 and 2013 and between 2013 and 2017 are missing';
            // svg.selectAll('.footnote')
            //     .data([data])
            //     .join('text')
            //     .attr('class', '.footnote')
            //     .attr('font-family', 'sans-serif')
            //     .attr('font-size', 12)
            //     .text(footnote)
            //     .attr('fill', '#aaa')
            //     .attr('transform', `translate(${margin.left-30} ,${height-margin.bottom+adjustment})`)
        }
    )