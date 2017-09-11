const math3d = require('math3d')

function _fromLonLatRad(lon,lat)
{
    var zd2 = 0.5*lon;
    var yd2 = -0.25*Math.PI - 0.5*lat;
    var Szd2 = Math.sin(zd2);
    var Syd2 = Math.sin(yd2);
    var Czd2 = Math.cos(zd2);
    var Cyd2 = Math.cos(yd2);
    var w = Czd2*Cyd2;
    var x = -Szd2*Syd2;
    var y = Czd2*Syd2;
    var z = Szd2*Cyd2;
    return new math3d.Quaternion(x,y,z,w);
}


function _MPServerClient( line ) {
  this.callsign = ''
  this.host = ''
  this.geod = {
    lat: 0,
    lng: 0,
    alt: 0
  }
  this.pos = [ 0, 0, 0 ]
  this.ori = [ 0, 0, 0 ]
  this.model = ''

  this.Parse( line )
}

_MPServerClient.prototype.Parse = function( line ) {

  var p = line.split(":")
  if( p.length != 2 ) return

  var p1 = p[0].trim().split("@")
  if( p1.length != 2 ) return

  this.callsign = p1[0]
  this.host = p1[1]

  p1 = p[1].trim().split(" ")
  this.geod.lat = Number(p1[3])
  this.geod.lng = Number(p1[4])
  this.geod.alt = Number(p1[5])
  this.pos = [ Number(p1[0]),Number(p1[1]),Number(p1[2]) ]
  this.oriQ = [ Number(p1[6]),Number(p1[7]),Number(p1[8]) ]
  this.model = p1[9]

  angleAxis = new math3d.Vector3( this.oriQ[0], this.oriQ[1], this.oriQ[2] )
  ecOrient = math3d.Quaternion.AngleAxis( angleAxis, angleAxis.magnitude * 180 / Math.PI )
  qEc2Hl = _fromLonLatRad(this.geod.lng * Math.PI / 180, this.geod.lat * Math.PI / 180);
  this.oriA = qEc2Hl.conjugate().mul(ecOrient).eulerAngles
}

/*
var res = new _MPServerClient("LATAM-8@LOCAL: -3015177.740109 4077182.227664 3855932.316763 37.434717 126.483847 641.779961 -3.507438 0.594748 -1.230743 Aircraft/777/Models/777-300ER.xml")
console.log(res)
*/

var net = require('net');
var client = new net.Socket();
client.connect(5001, 'mpserver01.flightgear.org', function() {
});

function handleLine( line )
{
  if( !line || line.startsWith( "#" ) )
    return
  var res = new _MPServerClient( line )
  console.log(line,res)
}

var linebuffer = ''
client.on('data', function(data) {
  linebuffer += data.toString()
  if(linebuffer.indexOf('\n') !=-1 ) {
    var lines = linebuffer.split('\n');
    // either '' or the unfinished portion of the next line
    linebuffer = lines.pop();
    lines.forEach(handleLine)
  }
});

client.on('close', function() {
  handleLine( linebuffer )
});

