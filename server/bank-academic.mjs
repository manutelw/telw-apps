// Academic question sets 03 to 25: original TELW tasks in the published IELTS Writing format.
// Task 1 covers every IELTS visual type. Figures are invented for practice and are internally
// consistent (pie charts total 100, values sit inside their axes). Sets are immutable once used.
import {academicSet as set} from './format.mjs';

const AGREE = 'To what extent do you agree or disagree?';
const BOTH = 'Discuss both these views and give your own opinion.';
const OUTWEIGH = 'Do the advantages of this outweigh the disadvantages?';
const DEVELOPMENT = 'Is this a positive or negative development?';

export const ACADEMIC_SETS = [
  set(3, 'The graph below shows the average amount that households in one country spent each month on landline telephones, mobile phones and home internet between 2010 and 2025.', {
    kind: 'line', title: 'Average monthly household spending on communication services', yLabel: 'US dollars per month', yMax: 60, yStep: 10,
    x: ['2010', '2013', '2016', '2019', '2022', '2025'],
    series: [
      {name: 'Landline telephone', values: [32, 27, 20, 14, 9, 6]},
      {name: 'Mobile phone', values: [24, 31, 38, 44, 47, 49]},
      {name: 'Home internet', values: [18, 21, 26, 33, 41, 52]}
    ]
  }, 'Some people think that governments should spend money on faster internet access for rural areas. Others believe that this money would be better spent on improving roads and public transport in those areas.', BOTH),

  set(4, 'The graph below shows the number of visitors to three national parks in one country between 1995 and 2020.', {
    kind: 'line', title: 'Annual visitors to three national parks, 1995–2020', yLabel: 'Visitors (millions)', yMax: 5, yStep: 1,
    x: ['1995', '2000', '2005', '2010', '2015', '2020'],
    series: [
      {name: 'Highland Park', values: [1.2, 1.5, 2.1, 2.9, 3.8, 4.4]},
      {name: 'Coastal Park', values: [3.1, 3.3, 3.2, 2.8, 2.5, 2.6]},
      {name: 'Lakeside Park', values: [0.6, 0.7, 1.1, 1.0, 1.6, 2.4]}
    ]
  }, 'Many popular natural areas are now so crowded with visitors that they are being damaged.', 'What are the causes of this problem, and what measures could be taken to solve it?'),

  set(5, 'The graph below shows the percentage of electricity produced from four different sources in one country between 2000 and 2025.', {
    kind: 'line', title: 'Sources of electricity, 2000–2025', yLabel: '% of electricity produced', yMax: 60, yStep: 10,
    x: ['2000', '2005', '2010', '2015', '2020', '2025'],
    series: [
      {name: 'Coal', values: [55, 51, 44, 33, 21, 12]},
      {name: 'Natural gas', values: [30, 32, 35, 37, 34, 30]},
      {name: 'Solar', values: [1, 2, 5, 11, 20, 27]},
      {name: 'Wind', values: [2, 4, 8, 13, 19, 25]}
    ]
  }, 'Some people believe that individuals can do little to protect the environment and that only governments and large companies can make a real difference.', AGREE),

  set(6, 'The chart below shows the percentage of men and women in four age groups in one country who took part in sport or exercise at least once a week in 2024.', {
    kind: 'bar', title: 'Weekly participation in sport or exercise, by age and sex, 2024', yLabel: '% taking part', yMax: 80, yStep: 10,
    x: ['16–24', '25–44', '45–64', '65 and over'],
    series: [
      {name: 'Men', values: [72, 58, 47, 31]},
      {name: 'Women', values: [61, 55, 50, 36]}
    ]
  }, 'Some people say that the best way to improve public health is to increase the number of sports facilities. Others think that this would have little effect and that other measures are needed.', BOTH),

  set(7, 'The chart below shows the number of international students at universities in five countries in 2010 and 2020.', {
    kind: 'bar', title: 'International university students, 2010 and 2020', yLabel: 'Students (thousands)', yMax: 500, yStep: 100,
    x: ['Country A', 'Country B', 'Country C', 'Country D', 'Country E'],
    series: [
      {name: '2010', values: [410, 260, 190, 120, 60]},
      {name: '2020', values: [450, 380, 170, 240, 150]}
    ]
  }, 'More and more students choose to study at universities in other countries.', OUTWEIGH),

  set(8, 'The chart below shows the average number of hours that secondary school students in six countries spent on homework each week in 2023.', {
    kind: 'bar', horizontal: true, title: 'Average weekly homework time of secondary school students, 2023', yLabel: 'Hours per week', yMax: 14, yStep: 2,
    x: ['Country P', 'Country Q', 'Country R', 'Country S', 'Country T', 'Country U'],
    series: [{name: 'Hours', values: [13.1, 9.6, 7.8, 6.2, 4.9, 3.4]}]
  }, 'Some people think that homework should be banned for children under twelve.', AGREE),

  set(9, 'The chart below shows the average monthly rainfall in two cities in one year.', {
    kind: 'bar', title: 'Average monthly rainfall in two cities', yLabel: 'Rainfall (mm)', yMax: 350, yStep: 50,
    x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    series: [
      {name: 'Port Ellis', values: [95, 80, 70, 55, 40, 25, 20, 30, 50, 85, 110, 120]},
      {name: 'Varanta', values: [10, 15, 20, 35, 90, 260, 330, 290, 180, 60, 20, 10]}
    ]
  }, 'Climate change is making extreme weather events such as floods and droughts more common.', 'Who should be responsible for protecting people from these events: individuals, local communities or national governments?'),

  set(10, 'The pie charts below show how one city council spent its budget in 2005 and 2025.', {
    kind: 'pie', title: 'City council spending, 2005 and 2025',
    charts: [
      {label: '2005', slices: [{name: 'Schools', value: 34}, {name: 'Roads and transport', value: 24}, {name: 'Social care', value: 18}, {name: 'Parks and leisure', value: 12}, {name: 'Administration', value: 12}]},
      {label: '2025', slices: [{name: 'Schools', value: 30}, {name: 'Roads and transport', value: 17}, {name: 'Social care', value: 31}, {name: 'Parks and leisure', value: 8}, {name: 'Administration', value: 14}]}
    ]
  }, 'In many countries, the proportion of older people is rising steadily.', 'What problems does this cause for individuals and society, and what can be done to reduce them?'),

  set(11, 'The pie charts below show the main ways that people travelled to work in three cities in 2024.', {
    kind: 'pie', title: 'Main method of travel to work, 2024',
    charts: [
      {label: 'Northbridge', slices: [{name: 'Car', value: 58}, {name: 'Bus or train', value: 22}, {name: 'Bicycle', value: 4}, {name: 'Walking', value: 9}, {name: 'Other', value: 7}]},
      {label: 'Eastvale', slices: [{name: 'Car', value: 31}, {name: 'Bus or train', value: 44}, {name: 'Bicycle', value: 8}, {name: 'Walking', value: 13}, {name: 'Other', value: 4}]},
      {label: 'Southport', slices: [{name: 'Car', value: 23}, {name: 'Bus or train', value: 29}, {name: 'Bicycle', value: 27}, {name: 'Walking', value: 18}, {name: 'Other', value: 3}]}
    ]
  }, 'Some people think that cars should be banned from city centres.', AGREE),

  set(12, 'The pie charts below show how energy is used in an average home in two countries.', {
    kind: 'pie', title: 'Household energy use in two countries',
    charts: [
      {label: 'Country X', slices: [{name: 'Heating', value: 52}, {name: 'Hot water', value: 18}, {name: 'Cooking', value: 6}, {name: 'Lighting', value: 5}, {name: 'Appliances', value: 19}]},
      {label: 'Country Y', slices: [{name: 'Heating', value: 8}, {name: 'Cooling', value: 34}, {name: 'Hot water', value: 12}, {name: 'Cooking', value: 15}, {name: 'Lighting', value: 9}, {name: 'Appliances', value: 22}]}
    ]
  }, 'Some people believe that the price of electricity and fuel should be raised to make people use less energy.', AGREE),

  set(13, 'The table below shows the percentage of households in one country that owned five household items in 1990, 2005 and 2020.', {
    kind: 'table', title: 'Households owning selected items (%)',
    head: ['Item', '1990', '2005', '2020'],
    rows: [['Washing machine', '72', '89', '96'], ['Microwave oven', '31', '78', '91'], ['Dishwasher', '9', '28', '49'], ['Home computer', '6', '58', '88'], ['Tumble dryer', '24', '51', '47']]
  }, 'Modern household appliances have given people more free time.', DEVELOPMENT),

  set(14, 'The table below shows information about five museums in one city in 2024.', {
    kind: 'table', title: 'Five city museums, 2024',
    head: ['Museum', 'Visitors (thousands)', 'Visitors from abroad (%)', 'Adult ticket (US dollars)', 'Average visit (hours)'],
    rows: [['National History', '1,840', '46', '0', '2.5'], ['Modern Art', '1,120', '61', '18', '1.5'], ['Science and Industry', '960', '22', '12', '3.0'], ['City Life', '310', '8', '6', '1.0'], ['Maritime', '275', '35', '10', '2.0']]
  }, 'Some people think that museums and art galleries should be free for everyone. Others believe that visitors should pay for entry.', BOTH),

  set(15, 'The bar chart below shows the number of cinema tickets sold to different age groups in one country in 2024, and the pie chart shows the types of film those tickets were for.', {
    kind: 'mixed', title: 'Cinema attendance, 2024',
    parts: [
      {kind: 'bar', title: 'Tickets sold by age group', yLabel: 'Tickets (millions)', yMax: 40, yStep: 10, x: ['Under 15', '15–24', '25–34', '35–54', '55 and over'], series: [{name: 'Tickets', values: [18, 36, 27, 21, 9]}]},
      {kind: 'pie', title: 'Tickets sold by type of film', charts: [{label: 'All tickets', slices: [{name: 'Action', value: 34}, {name: 'Animation', value: 22}, {name: 'Comedy', value: 17}, {name: 'Drama', value: 13}, {name: 'Horror', value: 9}, {name: 'Other', value: 5}]}]}
    ]
  }, 'Nowadays most people watch films at home on streaming services rather than at the cinema.', 'Why is this happening? Is it a positive or negative development?'),

  set(16, 'The line graph below shows the number of tourists who visited one country between 2015 and 2024, and the table shows how much tourists from different regions spent per day in 2024.', {
    kind: 'mixed', title: 'International tourism in one country',
    parts: [
      {kind: 'line', title: 'Tourist arrivals, 2015–2024', yLabel: 'Arrivals (millions)', yMax: 20, yStep: 5, x: ['2015', '2017', '2019', '2021', '2023', '2024'], series: [{name: 'Arrivals', values: [11.5, 13.2, 15.8, 4.1, 14.6, 17.3]}]},
      {kind: 'table', title: 'Average spending per tourist per day, 2024', head: ['Region of origin', 'US dollars'], rows: [['North America', '215'], ['Europe', '170'], ['East Asia', '190'], ['South Asia', '95'], ['Middle East', '240']]}
    ]
  }, 'Some countries depend heavily on income from tourism.', 'What problems can this cause? How can these countries reduce their dependence on tourism?'),

  set(17, 'The pie chart below shows the main reasons why adults in one country took part-time courses in 2024, and the bar chart shows the percentage of each age group taking such courses.', {
    kind: 'mixed', title: 'Adult part-time study, 2024',
    parts: [
      {kind: 'pie', title: 'Main reason for studying', charts: [{label: 'All adult learners', slices: [{name: 'Career progress', value: 41}, {name: 'Personal interest', value: 27}, {name: 'Changing jobs', value: 16}, {name: 'Meeting people', value: 9}, {name: 'Other', value: 7}]}]},
      {kind: 'bar', title: 'Adults taking a part-time course', yLabel: '% of age group', yMax: 30, yStep: 5, x: ['18–29', '30–44', '45–59', '60 and over'], series: [{name: '% studying', values: [26, 21, 14, 11]}]}
    ]
  }, 'Some people believe that it is never too late to learn, and that adults of any age should be encouraged to go back to education.', AGREE),

  set(18, 'The diagram below shows how glass bottles are recycled.', {
    kind: 'process', title: 'Recycling glass bottles',
    steps: [
      {label: 'Bottles collected from homes and bottle banks'}, {label: 'Taken to recycling plant'}, {label: 'Sorted by colour', note: 'clear, green, brown'}, {label: 'Washed and labels removed'},
      {label: 'Crushed into small pieces', note: 'called cullet'}, {label: 'Mixed with sand and soda ash'}, {label: 'Melted in furnace', note: '1,500 °C'}, {label: 'Moulded into new bottles'},
      {label: 'Filled, sealed and sent to shops'}
    ]
  }, 'Some people think that companies should be responsible for collecting and recycling the packaging of the products they sell.', AGREE),

  set(19, 'The diagram below shows how olive oil is produced.', {
    kind: 'process', title: 'Olive oil production',
    steps: [
      {label: 'Olives picked from trees', note: 'October to December'}, {label: 'Leaves and twigs removed'}, {label: 'Olives washed in cold water'}, {label: 'Crushed into a paste', note: 'stones included'},
      {label: 'Paste mixed slowly', note: '30–40 minutes'}, {label: 'Spun in a machine to separate oil'}, {label: 'Oil stored in steel tanks', note: '4–6 weeks'}, {label: 'Filtered and bottled'}
    ]
  }, 'Some people prefer to buy food that is produced locally, even if it costs more.', OUTWEIGH),

  set(20, 'The diagram below shows the life cycle of the honeybee.', {
    kind: 'process', cycle: true, title: 'Life cycle of the honeybee', centre: 'About 3 weeks from egg to adult worker',
    steps: [
      {label: 'Queen lays egg in wax cell'}, {label: 'Egg hatches', note: 'after 3 days'}, {label: 'Larva fed by worker bees', note: '6 days'},
      {label: 'Cell sealed; larva spins cocoon'}, {label: 'Pupa develops', note: '12 days'}, {label: 'Adult bee leaves cell'}, {label: 'Adult works in hive, then collects nectar'}
    ]
  }, 'The number of wild animal species is falling rapidly around the world.', 'Why is this happening, and what can be done to protect wildlife?'),

  set(21, 'The diagram below shows how rainwater is collected and reused in an office building.', {
    kind: 'process', cycle: true, title: 'Rainwater reuse in an office building', centre: 'Saves about 40% of mains water',
    steps: [
      {label: 'Rain falls on the roof'}, {label: 'Water runs into gutters and pipes'}, {label: 'Leaves and dirt removed by filter'}, {label: 'Stored in underground tank'},
      {label: 'Pumped to toilets and gardens'}, {label: 'Used water goes to drains'}, {label: 'Water evaporates and forms clouds'}
    ]
  }, 'Water shortages are becoming more common in many parts of the world.', 'What are the causes of this, and what steps could be taken to deal with the problem?'),

  set(22, 'The maps below show the centre of the town of Kelby in 2000 and today.', {
    kind: 'map', title: 'Kelby town centre',
    maps: [
      {label: '2000', features: [
        {type: 'river', points: [[0, 82], [40, 80], [100, 86]], label: 'River Kel', ly: 91},
        {type: 'road', points: [[0, 45], [100, 45]], label: 'High Street', ly: 41},
        {type: 'road', points: [[50, 0], [50, 80]]},
        {type: 'building', x: 8, y: 52, w: 30, h: 18, label: 'Bus station'},
        {type: 'building', x: 58, y: 52, w: 16, h: 14, label: 'Bank'},
        {type: 'building', x: 78, y: 52, w: 16, h: 14, label: 'Post office'},
        {type: 'building', x: 8, y: 10, w: 34, h: 26, label: 'Market'},
        {type: 'area', fill: 'parking', x: 58, y: 10, w: 34, h: 26, label: 'Car park'}
      ]},
      {label: 'Today', features: [
        {type: 'river', points: [[0, 82], [40, 80], [100, 86]], label: 'River Kel', ly: 91},
        {type: 'area', fill: 'trees', x: 0, y: 72, w: 100, h: 6, label: 'Riverside walk', ly: 75},
        {type: 'road', points: [[0, 45], [100, 45]], label: 'High Street (cars banned)', ly: 41},
        {type: 'path', points: [[50, 0], [50, 72]], label: 'Cycle path', lx: 55, ly: 25},
        {type: 'building', x: 8, y: 52, w: 30, h: 16, label: 'Library and café'},
        {type: 'building', x: 58, y: 52, w: 16, h: 14, label: 'Restaurant'},
        {type: 'building', x: 78, y: 52, w: 16, h: 14, label: 'Post office'},
        {type: 'building', x: 8, y: 10, w: 34, h: 26, label: 'Shopping centre'},
        {type: 'building', x: 58, y: 10, w: 34, h: 12, label: 'Apartments'},
        {type: 'area', fill: 'park', x: 58, y: 24, w: 34, h: 12, label: 'Square'}
      ]}
    ]
  }, 'Many town centres are losing their shops because people prefer to shop online.', 'What problems does this cause, and what could be done to bring people back to town centres?'),

  set(23, 'The map below shows two possible sites for a new supermarket in the town of Hallam.', {
    kind: 'map', title: 'Proposed supermarket sites in Hallam',
    maps: [{label: 'Hallam', scale: '1 km', features: [
      {type: 'river', points: [[0, 20], [35, 25], [62, 18], [100, 22]], label: 'River Hal', lx: 82, ly: 16},
      {type: 'road', points: [[0, 60], [100, 60]], label: 'Main road to city', lx: 14, ly: 56},
      {type: 'rail', points: [[30, 0], [30, 100]], label: 'Railway', lx: 22, ly: 8},
      {type: 'building', x: 36, y: 64, w: 26, h: 20, label: 'Town centre'},
      {type: 'area', fill: 'paved', x: 66, y: 64, w: 24, h: 26, label: 'Housing'},
      {type: 'area', fill: 'paved', x: 36, y: 34, w: 24, h: 20, label: 'Housing'},
      {type: 'building', x: 33, y: 86, w: 10, h: 8, label: 'Station', wrap: 8},
      {type: 'area', fill: 'field', x: 4, y: 64, w: 22, h: 30, label: 'Farmland'},
      {type: 'area', fill: 'trees', x: 66, y: 28, w: 28, h: 26, label: 'Forest'},
      {type: 'point', symbol: 'star', x: 14, y: 44, label: 'Site A (out of town)'},
      {type: 'point', symbol: 'star', x: 50, y: 92, label: 'Site B (near station)'}
    ]}]
  }, 'Large supermarkets are replacing small local shops in many places.', OUTWEIGH),

  set(24, 'The maps below show an island before and after it was developed for tourism.', {
    kind: 'map', title: 'Kalo Island, before and after development',
    maps: [
      {label: 'Before', scale: '100 m', features: [
        {type: 'area', fill: 'water', x: 0, y: 0, w: 100, h: 100},
        {type: 'area', fill: 'sand', points: [[20, 20], [80, 15], [90, 55], [70, 85], [25, 80], [10, 50]], label: 'Island'},
        {type: 'area', fill: 'trees', points: [[35, 35], [65, 30], [70, 55], [45, 65], [30, 55]], label: 'Palm trees'},
        {type: 'area', fill: 'sand', x: 64, y: 70, w: 14, h: 10, label: 'Beach', wrap: 8}
      ]},
      {label: 'After', scale: '100 m', features: [
        {type: 'area', fill: 'water', x: 0, y: 0, w: 100, h: 100},
        {type: 'area', fill: 'sand', points: [[20, 20], [80, 15], [90, 55], [70, 85], [25, 80], [10, 50]]},
        {type: 'area', fill: 'trees', x: 40, y: 36, w: 14, h: 12, label: 'Trees', wrap: 6},
        {type: 'building', x: 20, y: 30, w: 14, h: 18, label: 'Huts', wrap: 6},
        {type: 'building', x: 56, y: 24, w: 18, h: 8, label: 'Reception'},
        {type: 'building', x: 30, y: 58, w: 14, h: 10, label: 'Restaurant', wrap: 10},
        {type: 'area', fill: 'water', x: 58, y: 40, w: 12, h: 10, label: 'Pool'},
        {type: 'path', points: [[27, 48], [40, 52], [62, 32], [64, 45], [37, 58], [72, 72]], label: 'Footpath', lx: 50, ly: 49},
        {type: 'area', fill: 'sand', x: 64, y: 70, w: 14, h: 10, label: 'Beach', wrap: 8},
        {type: 'building', x: 86, y: 58, w: 12, h: 3, label: 'Pier', ly: 64},
        {type: 'path', points: [[80, 59], [86, 59]]}
      ]}
    ]
  }, 'Tourism brings money to remote places but can also damage the local environment and way of life.', OUTWEIGH),

  set(25, 'The maps below show a college campus in 2010 and in 2025.', {
    kind: 'map', title: 'Westfield College campus',
    maps: [
      {label: '2010', features: [
        {type: 'road', points: [[0, 92], [100, 92]], label: 'Station Road', ly: 97},
        {type: 'road', points: [[50, 92], [50, 72]]},
        {type: 'building', x: 30, y: 52, w: 40, h: 20, label: 'Main building'},
        {type: 'building', x: 8, y: 12, w: 22, h: 18, label: 'Library'},
        {type: 'area', fill: 'field', x: 40, y: 8, w: 52, h: 34, label: 'Sports field'},
        {type: 'area', fill: 'parking', x: 76, y: 56, w: 18, h: 30, label: 'Car park'},
        {type: 'area', fill: 'trees', x: 6, y: 56, w: 18, h: 30, label: 'Woodland'}
      ]},
      {label: '2025', features: [
        {type: 'road', points: [[0, 92], [100, 92]], label: 'Station Road', ly: 97},
        {type: 'road', points: [[50, 92], [50, 72]]},
        {type: 'building', x: 30, y: 52, w: 40, h: 20, label: 'Main building'},
        {type: 'building', x: 8, y: 12, w: 22, h: 18, label: 'Library'},
        {type: 'building', x: 40, y: 8, w: 24, h: 34, label: 'Student housing'},
        {type: 'area', fill: 'field', x: 68, y: 8, w: 24, h: 34, label: 'Sports pitch'},
        {type: 'building', x: 76, y: 56, w: 18, h: 30, label: 'Science centre'},
        {type: 'area', fill: 'parking', x: 6, y: 56, w: 18, h: 30, label: 'Car park'},
        {type: 'point', symbol: 'dot', x: 58, y: 86, label: 'Bus stop', lx: 66, ly: 86}
      ]}
    ]
  }, 'Some people think that universities should provide students with the practical skills needed for work. Others believe that the main purpose of a university is to give access to knowledge for its own sake.', BOTH)
];
