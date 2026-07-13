
/* =================== DATA =================== */
const PRODUCT_IMG = [
  'assets/img/tumbler.svg',
  'assets/img/headset.svg',
  'assets/img/sepatu.svg',
  'assets/img/powerbank.svg',
  'assets/img/jam.svg',
  'assets/img/tas.svg',
  'assets/img/keyboard.svg',
  'assets/img/lampu.svg',
];

const PRODUCTS = [
  {id:1, name:'Tumbler Termal Vacuum 500ml', variant:'Hitam · 500ml', price:89000, stock:142, status:'active', views:[120,180,150,220,280,310,290], sold:312, fee:5, cost:55000, desc:'Tumbler termal double wall vacuum dengan teknologi保冷保熱. Menjaga suhu dingin 24 jam, panas 12 jam. Material stainless steel 304 food grade, bebas BPA.'},
  {id:2, name:'Headset Bluetooth Pro Bass TWS', variant:'Putih · Pro', price:245000, stock:23, status:'active', views:[80,95,110,140,180,220,260], sold:178, fee:7, cost:140000, desc:'Headset TWS dengan driver 13mm, noise cancelling, dan baterai 36 jam dengan charging case. Bluetooth 5.3, tahan air IPX5.'},
  {id:3, name:'Sepatu Sneakers Casual Pria', variant:'42 · Abu', price:320000, stock:8, status:'active', views:[60,75,90,85,100,130,160], sold:94, fee:6, cost:180000, desc:'Sneakers casual upper canvas premium, sol karet anti-slip, insoles memory foam. Cocok untuk aktivitas sehari-hari.'},
  {id:4, name:'Power Bank 20000mAh Fast Charging', variant:'20K · Hitam', price:179000, stock:0, status:'inactive', views:[200,240,210,260,290,310,280], sold:421, fee:6, cost:95000, desc:'Power bank 20000mAh PD 22.5W fast charging, 2 port USB + 1 Type-C. LED display, perlindungan over-charge & suhu.'},
  {id:5, name:'Jam Tangan Pria Sport Anti Air', variant:'Hitam · 44mm', price:215000, stock:67, status:'active', views:[110,130,120,155,180,200,220], sold:156, fee:6, cost:110000, desc:'Jam tangan sporty dengan layar digital, chronograph, alarm, dan tahan air 50M. Strap rubber nyaman dipakai olahraga.'},
  {id:6, name:'Tas Selempang Wanita Canvas', variant:'Krem · L', price:135000, stock:34, status:'active', views:[70,85,95,110,125,140,165], sold:88, fee:5, cost:68000, desc:'Tas selempang canvas premium dengan tali adjustable, 3 kompartimen, cocok untuk harian & travel. Tampilan minimalis.'},
  {id:7, name:'Keyboard Mechanical RGB 87 Keys', variant:'Blue Switch', price:425000, stock:12, status:'active', views:[50,65,80,95,110,130,150], sold:67, fee:7, cost:260000, desc:'Keyboard mechanical 87 keys dengan blue switch tactile, RGB backlight 19 mode, hot-swappable, USB Type-C detachable.'},
  {id:8, name:'Lampu Meja LED Touch Dimmable', variant:'Putih', price:95000, stock:89, status:'active', views:[40,55,70,80,95,115,135], sold:134, fee:5, cost:48000, desc:'Lampu meja LED touch control dengan 3 mode warna & 5 level brightness. Port USB untuk charging handphone. Hemat energi 80%.'},
];

const CONVERSATIONS = [
  {id:1, name:'Dewi Wulandari', city:'Bandung', order:'AKL-2410-88213', color:'#FF6B7E', initial:'DW', online:true, unread:2, last:'Kak, tumbler yang hitam masih ready?', time:'14:32', messages:[
    {from:'buyer', text:'Halo kak, saya mau tanya tumbler termal 500ml', time:'14:28'},
    {from:'seller', text:'Halo kak Dewi, ada yang bisa dibantu? 😊', time:'14:29'},
    {from:'buyer', text:'Yang warna hitam masih ready stoknya?', time:'14:32'},
  ]},
  {id:2, name:'Budi Santoso', city:'Jakarta', order:'AKL-2410-88109', color:'#5B8DEF', initial:'BS', online:false, unread:1, last:'Orderan saya kok belum dikirim ya?', time:'14:15', messages:[
    {from:'buyer', text:'Selamat siang', time:'14:10'},
    {from:'buyer', text:'Orderan saya AKL-2410-88109 kok belum dikirim ya?', time:'14:15'},
  ]},
  {id:3, name:'Siti Rahmawati', city:'Surabaya', order:'AKL-2410-87954', color:'#A78BFA', initial:'SR', online:true, unread:0, last:'Sudah kak, terima kasih 🙏', time:'13:48', messages:[
    {from:'buyer', text:'Kak, headset TWS nya ada garansi?', time:'13:40'},
    {from:'seller', text:'Ada kak, garansi 1 tahun resmi', time:'13:42'},
    {from:'buyer', text:'Sudah kak, terima kasih 🙏', time:'13:48'},
  ]},
  {id:4, name:'Andi Pratama', city:'Medan', order:'AKL-2410-87890', color:'#10B981', initial:'AP', online:false, unread:0, last:'Oke ditunggu ya kak', time:'12:30', messages:[
    {from:'buyer', text:'Kak powerbank 20000mAh restock belum?', time:'12:20'},
    {from:'seller', text:'Dalam proses restock kak, estimasi 3 hari lagi', time:'12:25'},
    {from:'buyer', text:'Oke ditunggu ya kak', time:'12:30'},
  ]},
  {id:5, name:'Maya Sari', city:'Yogyakarta', order:'AKL-2410-87765', color:'#F59E0B', initial:'MS', online:true, unread:0, last:'Bisa COD area Jogja?', time:'11:45', messages:[
    {from:'buyer', text:'Bisa COD area Jogja?', time:'11:45'},
  ]},
  {id:6, name:'Rizki Firmansyah', city:'Semarang', order:'AKL-2410-87654', color:'#EC4899', initial:'RF', online:false, unread:0, last:'Terima kasih infonya kak', time:'10:22', messages:[
    {from:'buyer', text:'Sepatu size 42 restock kapan?', time:'10:15'},
    {from:'seller', text:'Sudah ready kak, silakan dipesan', time:'10:20'},
    {from:'buyer', text:'Terima kasih infonya kak', time:'10:22'},
  ]},
];

const INCOMING_MESSAGES = [
  {conv:1, text:'Apakah bisa dikirim hari ini kak?', delay:6000},
  {conv:2, text:'Soalnya udah 2 hari belum update resi', delay:12000},
  {conv:5, text:'Atau bisa meet up di Malioboro?', delay:20000},
  {conv:1, text:'Kalau ready saya order sekarang', delay:28000},
  {conv:3, text:'Kak, tambah lagi 1 dong, buat hadiah', delay:36000},
];

const ORDERS = [
  {id:'AKL-2410-88213', product:'Tumbler Termal 500ml', buyer:'Dewi Wulandari', status:'Diproses', cicilan:'3x', settle:'pending', settleText:'Belum Cair', date:'24 Okt 2024'},
  {id:'AKL-2410-88109', product:'Headset Bluetooth TWS', buyer:'Budi Santoso', status:'Dikirim', cicilan:'6x', settle:'partial', settleText:'Cair 50% · Nov', date:'22 Okt 2024'},
  {id:'AKL-2410-87954', product:'Sepatu Sneakers 42', buyer:'Siti Rahmawati', status:'Selesai', cicilan:'3x', settle:'cair', settleText:'Cair · 22 Okt', date:'15 Okt 2024'},
  {id:'AKL-2410-87890', product:'Power Bank 20000mAh', buyer:'Andi Pratama', status:'Diproses', cicilan:'12x', settle:'pending', settleText:'Belum Cair', date:'24 Okt 2024'},
  {id:'AKL-2410-87765', product:'Jam Tangan Sport 44mm', buyer:'Maya Sari', status:'Dikirim', cicilan:'6x', settle:'partial', settleText:'Cair 50% · Nov', date:'20 Okt 2024'},
  {id:'AKL-2410-87654', product:'Tas Selempang Canvas', buyer:'Rizki Firmansyah', status:'Selesai', cicilan:'3x', settle:'cair', settleText:'Cair · 18 Okt', date:'12 Okt 2024'},
  {id:'AKL-2410-87543', product:'Keyboard Mechanical RGB', buyer:'Joko Widodo', status:'Dikirim', cicilan:'6x', settle:'partial', settleText:'Cair 50% · Nov', date:'19 Okt 2024'},
  {id:'AKL-2410-87432', product:'Lampu Meja LED Touch', buyer:'Citra Lestari', status:'Selesai', cicilan:'3x', settle:'cair', settleText:'Cair · 14 Okt', date:'10 Okt 2024'},
  {id:'AKL-2410-87321', product:'Tumbler Termal 500ml', buyer:'Hendra Wijaya', status:'Diproses', cicilan:'3x', settle:'pending', settleText:'Belum Cair', date:'24 Okt 2024'},
  {id:'AKL-2410-87210', product:'Headset Bluetooth TWS', buyer:'Lina Marlina', status:'Dikirim', cicilan:'12x', settle:'pending', settleText:'Belum Cair', date:'23 Okt 2024'},
];

const TREND_TOP = [
  {name:'Tumbler Termal Vacuum 500ml', price:89000, sold:312, trend:'up', pct:'+42%', hot:true, img:PRODUCT_IMG[0]},
  {name:'Bottle Susu Estetik 350ml', price:65000, sold:268, trend:'up', pct:'+28%', hot:true, img:'assets/img/bottle.svg'},
  {name:'Tumbler Anak Karakter 400ml', price:78000, sold:198, trend:'up', pct:'+15%', hot:false, img:'assets/img/kids.svg'},
  {name:'Termos Lipat Mini 250ml', price:55000, sold:142, trend:'down', pct:'-8%', hot:false, img:'assets/img/mini.svg'},
  {name:'Tumbler Charger Genggam', price:145000, sold:124, trend:'up', pct:'+22%', hot:false, img:'assets/img/charge.svg'},
];

const RELATED_KEYWORDS = [
  {tag:'tumbler estetik', vol:'12.4K'},
  {tag:'botol minum termal', vol:'8.2K'},
  {tag:'tumbler anak', vol:'6.8K'},
  {tag:'termos vacuum', vol:'5.1K'},
  {tag:'tumbler custom', vol:'4.7K'},
  {tag:'botol susu', vol:'3.9K'},
  {tag:'tumbler murah', vol:'3.2K'},
  {tag:'flask 500ml', vol:'2.8K'},
];

const BUYER_MSGS_POOL = [
  'Kak, mau tanya produknya',
  'Apakah ready stoknya?',
  'Bisa dikirim hari ini?',
  'Berapa lama pengiriman ke saya?',
  'Apakah bisa COD?',
  'Produknya ada garansi?',
  'Saya mau order sekarang',
  'Warna lain ada?',
  'Size chart-nya bagaimana?',
  'Harga masih bisa nego?',
];

