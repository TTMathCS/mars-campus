import numpy as np, math
D2R=math.pi/180
H=np.load(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), '..', 'hraster.npy')); RES=0.5; EXT=132.0; N=H.shape[0]
def hq(x,z):
    i=np.clip(((np.asarray(x,float)+EXT)/RES).astype(int),0,N-1); j=np.clip(((np.asarray(z,float)+EXT)/RES).astype(int),0,N-1); return H[j,i]
def azpt(az,d): a=az*D2R; return np.array([math.sin(a)*d,-math.cos(a)*d])
def smooth(a,b,x):
    t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
P=dict(
  hall=dict(az=328.0,d=53.0,R=24.0,phiL=46.0,phiR=52.0,H=7.2,df=4.6,db=11.5),
  dome=dict(az=337.0,d=80.0,R=12.5,H=9.0),
  halo=dict(az=311.0,d=95.0,Rd=8.0,Hd=8.2),
  sign=dict(az=319.0,d=30.0,W=7.0,Ht=2.3),
  orbit=dict(az=326.0,d=84.0,R=13.0,alt=7.4),
  rovers=[(317.0,44.0),(336.0,43.0)],
)
def hall_pts(p,nu=90,nv=24):
    az=p['az']*D2R; u0=np.array([math.sin(az),-math.cos(az)]); M=u0*p['d']; C=M-u0*p['R']
    out=[]
    for u in np.linspace(0,1,nu):
        w=math.sin(math.pi*u)
        h=p['H']*(1-(1-w)**1.6)
        df=p['df']*(0.3+0.7*w**0.6); db=p['db']*(0.3+0.7*w**0.8)
        alpha=(-p['phiL']+(p['phiL']+p['phiR'])*u)*D2R
        r=np.array([math.sin(az+alpha),-math.cos(az+alpha)])
        hg=min(h*0.62,4.6)
        prof=[(-df+1.0,0),(-df+1.0,hg),(-df,hg)]
        for s in np.linspace(0,1,nv):
            a=s*math.pi/2; prof.append((-df*math.cos(a), hg+(h-hg)*math.sin(a)**0.9))
        for s in np.linspace(0,1,nv):
            prof.append((db*s, h*max(0,1-s**1.7)**1.4))
        # ground ref
        gs=[float(hq(*(C+r*(p['R']+o)))) for o,_ in prof]
        gref=float(np.mean(gs))
        for o,y in prof:
            q=C+r*(p['R']+o); g=float(hq(*q))
            k=float(smooth(0,2,y)); yy=y+g*(1-k)+gref*k
            out.append((q[0],yy,q[1]))
    return np.array(out), C
def dome_pts(p):
    c=azpt(p['az'],p['d']); out=[]
    ring=[float(hq(*(c+p['R']*np.array([math.cos(t),math.sin(t)])))) for t in np.linspace(0,2*math.pi,24,endpoint=False)]
    gref=np.mean(ring)
    for ph in np.linspace(0,math.pi/2,12):
        for t in np.linspace(0,2*math.pi,48,endpoint=False):
            r=p['R']*math.cos(ph); y=p['H']*math.sin(ph)
            q=c+r*np.array([math.cos(t),math.sin(t)]); out.append((q[0],gref+y,q[1]))
    return np.array(out)
def halo_pts(p):
    c=azpt(p['az'],p['d']); g=float(hq(*c)); out=[]
    for t in np.linspace(0,2*math.pi,32,endpoint=False):
        q=c+p['Rd']*np.array([math.cos(t),math.sin(t)]); out.append((q[0],g+p['Hd'],q[1]))
    out.append((c[0],g+p['Hd']+2.4,c[1]))  # craft top
    for y in np.linspace(0,p['Hd'],10): out.append((c[0]+1.5,g+y,c[1]))
    return np.array(out)
def sign_pts(p):
    c=azpt(p['az'],p['d']); g=float(hq(*c)); out=[]
    for s in np.linspace(-p['W']/2,p['W']/2,9):
        tangent=np.array([math.cos(p['az']*D2R),math.sin(p['az']*D2R)])
        q=c+tangent*s; out.append((q[0],float(hq(*q))+p['Ht'],q[1]))
    return np.array(out)
def orbit_pts(p):
    c=azpt(p['az'],p['d']); out=[]
    for t in np.linspace(0,2*math.pi,48,endpoint=False):
        q=c+p['R']*np.array([math.cos(t),math.sin(t)]); out.append((q[0],float(hq(*q))+p['alt']+0.9,q[1]))
    return np.array(out)
def rover_pts(p):
    out=[]
    for az,d in p['rovers']:
        c=azpt(az,d); out.append((c[0],float(hq(*c))+3.9,c[1]))
    return np.array(out)
def all_pts(p=P):
    hp,C=hall_pts(p['hall'])
    parts={'hall':hp,'dome':dome_pts(p['dome']),'halo':halo_pts(p['halo']),'sign':sign_pts(p['sign']),'orbit':orbit_pts(p['orbit']),'rovers':rover_pts(p)}
    return parts
def vis(ex,ez,Pts,eye=1.7):
    e=float(hq(ex,ez))+eye; Pts=np.asarray(Pts,float)
    dx=Pts[:,0]-ex; dz=Pts[:,2]-ez
    t=np.linspace(0.02,0.985,300)[None,:]
    hs=hq(ex+dx[:,None]*t, ez+dz[:,None]*t)
    line=e+(Pts[:,1][:,None]-e)*t
    return ~np.any(hs>line+0.02,axis=1)
def margin(ex,ez,Pts,eye=1.7):
    # how much higher (m) each point could be while still hidden (negative = visible)
    e=float(hq(ex,ez))+eye; Pts=np.asarray(Pts,float)
    dx=Pts[:,0]-ex; dz=Pts[:,2]-ez
    t=np.linspace(0.02,0.985,300)[None,:]
    hs=hq(ex+dx[:,None]*t, ez+dz[:,None]*t)
    ymax=np.max(e+(hs-e)/t,axis=1)
    return ymax-Pts[:,1]
