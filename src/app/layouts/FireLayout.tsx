import type { ReactNode } from "react";

// Drop this into your RWSDK layout or use as a wrapper server component:
//
//   import { FireLayout } from "@/app/components/FireLayout";
//
//   export default function Page() {
//     return (
//       <FireLayout>
//         <h1>Your content here</h1>
//       </FireLayout>
//     );
//   }

const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{min-height:100%}

/* Dark bg + hell glow rising from bottom */
.fw-bg-fixed{
  position:fixed;inset:0;
  background:
    radial-gradient(ellipse 120% 45% at 50% 100%, rgba(180,30,10,0.32) 0%, transparent 65%),
    radial-gradient(ellipse 80% 28% at 50% 100%, rgba(232,93,4,0.2) 0%, transparent 55%),
    #060a06;
  z-index:0;
  pointer-events:none;
}

/* Root scrolls normally */
.fw-root{
  position:relative;
  z-index:1;
  min-height:100vh;
}

/* Flames — anchored to bottom, peek up subtly */
.fw-flames{
  position:fixed;
  bottom:0;left:0;right:0;
  height:40vh;
  opacity:0.12;
  pointer-events:none;
  display:flex;
  align-items:flex-end;
  justify-content:center;
  overflow:hidden;
}
.fw-flames svg{
  flex-shrink:0;
  width:340px;
  height:auto;
  margin-left:-20px;
}

/* Embers — only bottom half */
.fw-embers{
  position:fixed;
  bottom:0;left:0;right:0;
  height:55vh;
  pointer-events:none;
  overflow:hidden;
  opacity:0.45;
}

/* Card — transparent shell, content owns its own bg */
.fw-card-wrap{
  position:relative;
  z-index:10;
  min-height:100vh;
}
.fw-card{
  width:100%;
  min-height:100vh;
}

/* Flame animations */
.flame{animation:flameDisappear 2s linear infinite;opacity:0.5;transform-origin:45% 45% 0}
.flame.one{animation-delay:1s;animation-duration:3s}
.flame.two{animation-duration:5s;animation-delay:1s}
.flame-main{animation:flameMovement 2s ease-in-out infinite}
.flame-main.one{animation-duration:2.2s;animation-delay:1s}
.flame-main.two{animation-duration:2s;animation-delay:1s}
.flame-main.three{animation-duration:2.1s;animation-delay:3s}

@keyframes flameMovement{50%{transform:scale(0.98,1.0) translate(0,2px) rotate(-1deg)}}
@keyframes flameDisappear{
  0%{transform:translate(0) rotate(180deg)}
  50%{opacity:1}
  100%{transform:translate(-10px,-40px) rotate(180deg);opacity:0}
}

/* Ember keyframes */
@keyframes em0{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.68}80%{opacity:0.26}100%{opacity:0;transform:translate(-136px,-203px) scale(0.1)}}
@keyframes em1{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.79}80%{opacity:0.37}100%{opacity:0;transform:translate(-171px,-194px) scale(0.1)}}
@keyframes em2{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.66}80%{opacity:0.39}100%{opacity:0;transform:translate(-44px,-180px) scale(0.1)}}
@keyframes em3{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.94}80%{opacity:0.21}100%{opacity:0;transform:translate(-72px,-120px) scale(0.1)}}
@keyframes em4{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.92}80%{opacity:0.26}100%{opacity:0;transform:translate(-73px,-164px) scale(0.1)}}
@keyframes em5{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.73}80%{opacity:0.24}100%{opacity:0;transform:translate(-101px,-166px) scale(0.1)}}
@keyframes em6{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.70}80%{opacity:0.34}100%{opacity:0;transform:translate(-59px,-319px) scale(0.1)}}
@keyframes em7{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.63}80%{opacity:0.45}100%{opacity:0;transform:translate(-143px,-169px) scale(0.1)}}
@keyframes em8{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.84}80%{opacity:0.36}100%{opacity:0;transform:translate(-57px,-232px) scale(0.1)}}
@keyframes em9{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.92}80%{opacity:0.41}100%{opacity:0;transform:translate(-175px,-334px) scale(0.1)}}
@keyframes em10{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.73}80%{opacity:0.23}100%{opacity:0;transform:translate(-146px,-310px) scale(0.1)}}
@keyframes em11{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.93}80%{opacity:0.48}100%{opacity:0;transform:translate(-53px,-238px) scale(0.1)}}
@keyframes em12{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.71}80%{opacity:0.39}100%{opacity:0;transform:translate(-63px,-147px) scale(0.1)}}
@keyframes em13{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.74}80%{opacity:0.36}100%{opacity:0;transform:translate(-59px,-151px) scale(0.1)}}
@keyframes em14{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.83}80%{opacity:0.38}100%{opacity:0;transform:translate(-97px,-312px) scale(0.1)}}
@keyframes em15{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.83}80%{opacity:0.32}100%{opacity:0;transform:translate(-137px,-176px) scale(0.1)}}
@keyframes em16{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.92}80%{opacity:0.20}100%{opacity:0;transform:translate(-165px,-316px) scale(0.1)}}
@keyframes em17{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.80}80%{opacity:0.21}100%{opacity:0;transform:translate(-192px,-133px) scale(0.1)}}
@keyframes em18{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:1.00}80%{opacity:0.24}100%{opacity:0;transform:translate(-109px,-314px) scale(0.1)}}
@keyframes em19{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.88}80%{opacity:0.22}100%{opacity:0;transform:translate(-71px,-264px) scale(0.1)}}
@keyframes em20{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.88}80%{opacity:0.23}100%{opacity:0;transform:translate(-80px,-330px) scale(0.1)}}
@keyframes em21{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.64}80%{opacity:0.45}100%{opacity:0;transform:translate(-124px,-255px) scale(0.1)}}
@keyframes em22{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.90}80%{opacity:0.37}100%{opacity:0;transform:translate(-110px,-328px) scale(0.1)}}
@keyframes em23{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.79}80%{opacity:0.43}100%{opacity:0;transform:translate(-185px,-323px) scale(0.1)}}
@keyframes em24{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.60}80%{opacity:0.23}100%{opacity:0;transform:translate(-194px,-299px) scale(0.1)}}
@keyframes em25{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.95}80%{opacity:0.49}100%{opacity:0;transform:translate(-81px,-149px) scale(0.1)}}
@keyframes em26{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.65}80%{opacity:0.28}100%{opacity:0;transform:translate(-174px,-338px) scale(0.1)}}
@keyframes em27{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.67}80%{opacity:0.21}100%{opacity:0;transform:translate(-178px,-161px) scale(0.1)}}
@keyframes em28{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.80}80%{opacity:0.31}100%{opacity:0;transform:translate(-141px,-291px) scale(0.1)}}
@keyframes em29{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.89}80%{opacity:0.33}100%{opacity:0;transform:translate(-53px,-302px) scale(0.1)}}
@keyframes em30{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.84}80%{opacity:0.47}100%{opacity:0;transform:translate(-71px,-188px) scale(0.1)}}
@keyframes em31{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.77}80%{opacity:0.36}100%{opacity:0;transform:translate(-80px,-279px) scale(0.1)}}
@keyframes em32{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.95}80%{opacity:0.21}100%{opacity:0;transform:translate(-127px,-236px) scale(0.1)}}
@keyframes em33{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.61}80%{opacity:0.42}100%{opacity:0;transform:translate(-76px,-138px) scale(0.1)}}
@keyframes em34{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.86}80%{opacity:0.23}100%{opacity:0;transform:translate(-198px,-143px) scale(0.1)}}
@keyframes em35{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.63}80%{opacity:0.33}100%{opacity:0;transform:translate(-148px,-293px) scale(0.1)}}
@keyframes em36{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.75}80%{opacity:0.34}100%{opacity:0;transform:translate(-173px,-290px) scale(0.1)}}
@keyframes em37{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.88}80%{opacity:0.43}100%{opacity:0;transform:translate(-75px,-256px) scale(0.1)}}
@keyframes em38{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.86}80%{opacity:0.45}100%{opacity:0;transform:translate(-151px,-332px) scale(0.1)}}
@keyframes em39{0%{opacity:0;transform:translate(0,0) scale(1)}10%{opacity:0.94}80%{opacity:0.30}100%{opacity:0;transform:translate(-128px,-142px) scale(0.1)}}
`;

function FlameSVG({ delay = "0s" }: { delay?: string }) {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1016 493"
      style={{ animationDelay: delay }}
    >
      <g>
        <path className="flame" fill="#F58553" d="M260.138,279.034c0.329,2.103,0.929,3.955,3.466,1.591c1.36-1.269,2.555-2.34,2.946-4.48c0.611-3.344,1.288-6.88,4.965-9.637C262.791,267.109,258.981,271.64,260.138,279.034z"/>
        <path className="flame one" fill="#F58553" d="M642.133,261.121c-0.602,1.805,2.854,4.751,5.137,4.486c2.775-0.322,5.049-1.429,4.986-4.831c-0.051-2.835-2.447-5.298-5.188-5.287C643.428,255.591,642.939,258.697,642.133,261.121z"/>
        <path className="flame two" fill="#F58553" d="M236.169,192.895c2.469-0.638,4.981-0.998,4.781-3.98c-0.117-1.744-0.676-3.642-3.098-3.758c-2.766-0.133-4.256,1.769-4.511,3.915C233.163,190.574,234.413,192.402,236.169,192.895z"/>
      </g>
      <path
        className="flame-main one"
        fill="#DF513D"
        d="M855.631,466.945C944.262,471.891,972,449.18,972,449.18C1027,321.359,944.33,235,944.33,235c-25.416-5.286-45.699-63.5-49.117-88.546c-1.01-7.383,0.025-15.348,1.727-22.938c4.066-18.146,11.555-34.489,25.205-47.463c6.234-5.924,13.301-10.446,23.752-8.588c-14.379-8.771-28.559-10.971-43.646-6.452c-13.455,4.031-24.506,11.925-34.635,21.463c-10.742,10.116-19.926,21.219-25.68,34.991c-2.672,6.39-4.943,12.996-5.521,19.735c-0.764,8.926-0.973,18.003,0.777,26.961c1.719,8.808,4.424,17.371,8.691,25.153c5.264,9.596,10.76,18.952,14.289,29.435c3.588,10.658,5.154,21.481,3.627,32.481c-1.809,13.028-7.438,24.381-17.133,33.622c-7.992,7.619-16.848,7.064-23.23-1.906c-2.838-3.988-4.801-8.185-5.996-13.175c-2.541-10.627-1.035-20.107,5.604-28.506c7.814-9.888,11.92-20.496,9.221-33.241c-2.605-12.3-14.936-23.608-25.422-24.022c4.357,3.514,10.586,11.164,13.289,16.328c4.455,8.511,3.699,18.335-3.877,25.045c-5.648,5.003-10.664,10.654-14.902,17.021c-3.209,4.823-6.195,9.681-7.303,15.373c-0.564,2.904-0.221,5.978-0.387,8.969c-0.057,1.005,0.322,2.667-1.828,1.731c-5.561-2.418-9.982-6.14-10.158-14.216c-0.094-4.266,2.254-7.965,2.404-12.128c0.379-10.409-8.141-20.954-19.229-22.816c-10.182-1.711-18.287,2.746-23.861,14.147c2.469-0.808,4.727-1.556,6.992-2.286c2.447-0.789,4.965-0.24,7.432-0.234c7.539,0.02,14.816,8.159,13.32,16.086c-1.266,6.717-4.697,12.408-7.08,18.555c-4.266,10.991-10.574,21.106-14.582,32.256c-4.201,11.694-7.123,23.498-4.744,36.104c0.408,2.16,2.133,4.087,1.367,7.061c-7.738-8.408-16.045-15.436-25.604-20.918c-8.41-4.82-17.121-8.909-26.645-10.926c-2.17-0.459-3.08-1.602-3.496-3.445c-0.963-4.267-3.477-7.051-7.836-7.607c-4.699-0.601-7.273,2.641-9.066,6.234c-1.064,2.138-2.082,2.248-4.195,1.928c-15.563-2.355-27.02-11.037-35.943-23.396c-11.643-16.123-16.396-34.125-14.266-54.008c1.791-16.705,8.824-30.894,19.84-43.279c11.209-12.603,25.119-21.442,40.432-28.448c-19.779,3.385-45.439,14.517-59.5,31.411c-4.191,4.213-7.574,9.034-10.373,14.242c-5.674,10.557-8.674,21.895-10.453,33.734c-1.299,8.649-1.73,17.34-0.422,25.789c1.697,10.957,5.266,21.479,10.924,31.289c5.309,9.2,11.873,17.521,17.426,26.535c2.143,3.479,1.92,6.092-1.285,8.326c-1.924,1.344-4.066,2.461-6.248,3.335c-6.979,2.798-14.191,2.927-21.504,1.562c-15.086-2.816-26.398-10.412-31.984-25.242c-4.852-12.872-3.498-25.889-0.332-38.765c3.709-15.087,9.834-29.463,13.641-44.539c3.434-13.596,6.252-27.32,7.219-41.325c0.73-10.567,0.684-21.164-0.883-31.693c-0.072-4.321-2.307-7.884-4.096-11.609c-3.334-8.141-8.697-14.584-16.004-19.415c2.986,4.352,6.135,8.549,8.773,13.114c-0.141,4.219,3.092,7.335,3.691,11.312c1.229,7.339,3.654,14.469,3.854,21.993c0.277,7.069-0.301,14.054-1.268,21.083c-1.262,9.162-3.033,18.159-5.955,26.918c-2.639,7.904-5.814,15.605-8.836,23.359c-3.461,8.881-7.283,17.65-10.363,26.707c-4.963,14.591-10.781,28.851-14.065,44.032c-3.851,17.809-2.452,34.576,6.944,50.396c0.607,12.178-6.601,21.589-20.336,22.445c-16.567,1.032-29.487-7.037-33.707-22.111c-2.169-7.747-1.702-15.574-0.003-23.352c3.305-15.127,10.624-28.352,19.604-40.729c4.995-6.886,8.435-14.472,9.014-22.863c1.204-17.457-5.281-31.88-19.167-42.561c-5.162-3.97-11.1-6.564-18.131-5.406c-11.898,1.959-15.779,14.669-16.513,26.118c1.964-2.698,3.785-5.37,5.781-7.906c3.604-4.581,8.707-5.385,13.817-4.151c13.203,3.188,19.3,17.235,12.706,28.876c-2.606,4.6-5.966,8.563-10.19,11.975c-5.143,4.15-9.367,9.452-14.577,13.502c-5.938,4.618-11.283,9.875-15.389,15.926c-5.288,7.796-11.634,13.953-20.057,17.894c-7.237,3.384-17.27,4.203-22.724-2.331c-4.678-5.603-4.442-12.041-2.223-18.393c6.571-18.801,14.331-37.188,18.802-56.705c2.512-10.964,3.926-22.005,3.771-33.219c-0.293-21.134-7.547-39.917-19.95-56.795c-0.441,3.125,0.279,5.327,0.699,7.361c2.643,12.804,3.729,25.771,4.406,38.768c0.407,7.829-0.424,15.631-1.206,23.472c-1.115,11.184-3.351,21.955-7.212,32.455c-2.723,7.409-6.812,14.064-11.788,20.079c-4.364,5.276-9.939,9.478-16.148,12.21c-8.284,3.646-17.829-2.003-19.39-11.826c-2.665-16.773-0.41-32.809,9.74-47.062c-7.514,5.889-14.286,12.32-19.609,20.456c-9.272,14.171-13.619,29.941-15.935,46.323c-1.771,12.528-3.694,24.94-7.695,36.989c-4.727,14.237-21.139,24.276-35.978,21.826c-9.413-1.554-15.849-7.425-20.69-15.005c-14.236-22.295-12.316-45.057-1.232-67.882c4.195-8.637,10.013-16.207,16.315-23.659c-12.587-1.713-22.69,2.739-31.15,11.041c-10.202,10.013-14.693,23.224-18.941,36.383c-13.538-10.804-22.13-24.641-25.489-41.673c0.1-11.729,1.626-23.235,5.648-34.413c-13.677,20.313-16.274,43.052-14.618,66.643c0.372,5.296-0.561,10.181-2.291,14.941c-2.936,8.075-8.172,9.575-14.724,4.1c-4.525-3.783-8.732-8.006-12.714-12.367c-11.834-12.958-18.152-28.218-18.812-45.852c-0.748-19.978,4.404-38.725,11.956-56.868c8.639-20.756,11.392-41.894,6.258-63.94c-2.858-12.27-8.542-23.307-15.923-33.204c-16.292-10.449-32.993-13.009-50.84-3.433c12.039,3.249,22.931,8.94,31.515,17.937c10.389,10.89,12.899,24.402,9.939,38.878c-2.776,13.572-7.482,26.616-12.908,39.293c-7.716,18.031-16.924,35.417-22.425,54.384c-2.498,8.614-4.16,17.295-4.617,26.232c-2.667-3.337-4.792-6.98-6.257-11.027c-5.234-14.466-3.651-28.882,0.609-43.142c2.264-7.577,5.338-14.913,8.438-23.433c-9.685,11.352-10.991,57.244-10.991,57.244c1.626,14.097,6.347,27.808,5.391,42.253c-0.504,7.608-0.817,15.015-6.939,21.076c0,0-52.749,96.413-18.563,155.781c4.75,8.249,402.17,17.768,402.17,17.768c74.932,0.005,149.866,0.012,224.799-0.001c27.342-0.005,54.686-0.057,82.025-0.088c16.762-0.006,53.166,0.087,54.609,0.087"
      />
      <path
        className="flame-main two"
        fill="#F26C52"
        d="M976.667,324.592c1.229,3.776,2.013,7.837,2.314,12.227c0,0,0.169-78.337-70.811-125.496c-12.488-10.562-22.174-23.317-29.328-37.979c-5.111-10.474-8.277-21.568-8.316-33.246c-0.061-17.212,5.729-32.611,15.887-46.398c4.676-6.347,9.795-12.306,16.17-17.068c0.813-0.606,1.436-1.467,2.709-2.8c-6.471,0.968-11.582,3.497-16.594,6.001c-12.121,6.057-21.768,15.038-29.004,26.446c-6.633,10.455-9.918,22.096-10.471,34.407c-0.984,21.887,5.711,41.839,15.961,60.806c5.223,9.667,11.035,19.048,12.852,30.185c3.426,20.996,1.273,40.842-11.291,58.79c-8.707,12.435-26.303,19.606-40.416,16.137c-9.441-2.322-14.35-9.342-17.363-17.764c-5.699-15.928-4.258-31.144,5.617-45.238c3.137-4.479,6.176-9.028,9.457-13.835c-4.576,1.163-16.156,14.673-20.363,23.321c-4.803,9.866-1.631,20.479-2.895,30.676c-10.527-3.265-23.447-14.418-21.99-27.205c0.559-4.914,0.131-9.867,1.447-14.806c1.6-5.992-1.145-11.556-6.531-14.658c-3.473-2.001-7.193-3.389-11.336-3.133c2.994,1.594,6.342,2.346,8.82,4.939c1.842,1.928,2.898,4.032,2.977,6.617c0.418,13.832-1.627,26.889-8.738,39.294c-8.867,15.469-13.41,32.414-12.527,50.462c0.334,6.838,2.555,13.077,7.289,18.236c8.326,9.069,9.984,20.421,5.266,31.396c-0.754,1.757-1.402,3.433-3.953,1.573c-11.662-8.503-23.174-17.189-33.09-27.736c-4.387-4.665-8.094-9.967-12.469-14.646c-8.01-8.57-18.422-11.793-29.779-13.402c-16.861-2.39-33.697-5.066-47.652-16.334c-9.074-7.328-15.014-16.762-19.492-27.226c-5.621-13.131-8.916-26.752-8.33-41.222c0.371-9.153,2.295-17.872,5.559-26.362c-2.08,0.743-2.357,2.227-2.844,3.376c-4.656,11.01-8.379,22.354-10.244,34.152c-1.172,7.397-0.301,14.827,1.813,22.155c3.832,13.296,10.604,25.058,18.066,36.521c3.5,5.377,7.021,10.748,10.359,16.227c5.326,8.736,2.068,19.219-7.029,24.131c-8.594,4.64-17.66,5.329-27.082,4.19c-4.563-1.718-9.17-3.33-13.684-5.174c-18.088-7.387-30.508-23.889-30.627-44.457c-0.076-12.859,3.195-24.85,6.871-36.87c3.832-12.531,7.818-25.016,11.65-37.546c0.715-2.342,1.018-4.81,0.652-7.516c-1.91,4.821-3.895,9.615-5.719,14.47c-5.123,13.62-10.459,27.169-15.178,40.93c-4.24,12.366-8.473,24.877-8.307,38.179c0.162,12.924,4.285,24.588,11.971,35.119c3.307,4.531,7.906,8.158,9.961,13.563c3.859,10.151,1.246,19.344-4.648,27.839c-10.016,14.438-24.234,17.849-40.832,15.78c-7.385-0.92-14.406-2.816-21.246-5.422c-13.549-5.159-20.191-16.348-23.844-29.433c-5.659-20.297-1.638-39.06,9.969-56.494c7.352-11.042,16.057-20.996,24.254-31.362c10.086-12.758,9.057-28.586-2.361-40.235c-5.086-5.189-10.006-10.389-17.781-11.482c-3.191-0.448-6.057-0.333-8.852,1.574c6.895-0.15,12.607,2.547,17.379,7.047c11.996,11.316,13.275,24.909,4.355,39.414c-4.842,7.876-10.643,15.015-17.059,21.489c-9.441,9.529-17.724,20.023-26.696,29.926c-7.03,7.757-15.354,14.125-26.103,15.848c-13.623,2.184-29.494-4.447-30.713-21.896c-0.891-12.764,2.373-24.592,7.247-36.053c4.003-9.414,8.815-18.479,12.995-27.823c5.777-12.917,6.504-26.398,4.506-40.307c-1.439-10.016-4.09-19.696-6.574-29.444c-1.287,0.388-0.861,1.473-0.895,2.303c-0.65,16.369-3.062,32.494-6.676,48.451c-2.785,12.297-6.24,24.348-12.229,35.561c-6.266,11.733-15.305,19.604-28.64,22.453c-9.214,1.968-15.219-2.511-18.5-9.665c-5.24-11.428-6.019-23.727-4.448-36.16c0.309-2.44,0.587-4.884,1.013-8.444c-3.861,7.471-6.259,14.328-8.441,21.26c-4.343,13.795-5.548,28.134-7.463,42.374c-1.608,11.957-3.538,23.914-8.479,35.022l-15.857,20.554c-7.382,5.247-16.351,7.71-26.848,7.29c-8.636-0.345-15.731-4.848-21.172-11.485c-11.316-13.803-16.834-30.063-19.095-47.496c-1.957-15.088,2.089-29.289,7.337-43.214c1.781-4.724,4.593-8.914,7.143-13.301c-6.168,4.492-11.489,9.746-14.327,16.926c-3.176,8.032-5.8,16.283-8.966,24.32c-1.615,4.101-3.291,8.944-8.447,9.479c-4.833,0.5-7.611-3.513-10.353-6.885c-4.711-5.799-9.38-11.66-13.003-18.207c-5.151-9.312-7.396-19.474-8.453-30.011c-0.391-3.899-0.656-7.797-1.01-11.71c-2.149,14.851-3.22,29.688-0.711,44.639c0.993,5.913,1.636,11.873,0.565,17.956c-2.594,14.728-14.194,19.696-27.364,15.702c-17.352-5.263-28.268-17.412-35.249-33.595c-7.923-18.365-10.003-37.727-8.615-57.398c1.024-14.504,5.077-28.423,9.827-42.23c4.295-12.483,9.772-24.487,13.912-37.012c5.05-15.277,2.599-29.875-3.141-44.386c-2.809-7.1-6.498-13.438-12.36-18.428c-1.311-1.115-2.546-2.211-4.886-2.353c1.798,5.031,3.791,9.689,5.134,14.529c5.293,19.076,2.46,37.394-5.948,54.979c-4.234,8.854-9.156,17.38-13.41,26.226c-9.552,19.863-15.102,40.924-18.531,62.641c-1.506,9.536-2.45,19.081-2.274,29.927c-8.867-10.378-16.602-20.101-23.522-30.626c1.123,6.077,2.47,12.124,3.324,18.239c2.06,14.749,4.544,29.489,1.258,44.428c0,0-16.868-12.046-33.307,36.978c7.755-5.54,11.074-12.951,11.394-22.115c1.795,1.347,3.208,2.806,4.3,4.374C6.589,401.313,52,444,52,444c156.805,14.154,296.961,20.449,417.648,22.161c148.598,1.953,267.32-3.039,350.782-8.784C918.027,451.008,966,444,966,444C987.153,425.667,981.715,361.088,976.667,324.592z"
      />
    </svg>
  );
}

export function FireLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="fw-bg-fixed" aria-hidden="true" />
      <div className="fw-root">

        {/* Flame background layer — very transparent */}
        <div className="fw-flames">
          <FlameSVG delay="0s" />
          <FlameSVG delay="0.8s" />
          <FlameSVG delay="1.6s" />
        </div>

        {/* Embers */}
        <div className="fw-embers">
          <div style={{position:"absolute",width:"8px",height:"8px",borderRadius:"50%",background:"#ffee88",filter:"blur(1.5px)",left:"40%",bottom:"19%",animation:"em0 4.3s ease-out 6.0s infinite"}} />
          <div style={{position:"absolute",width:"13px",height:"13px",borderRadius:"50%",background:"#ff8800",filter:"blur(1.5px)",left:"55%",bottom:"24%",animation:"em1 3.6s ease-out 5.8s infinite"}} />
          <div style={{position:"absolute",width:"11px",height:"11px",borderRadius:"50%",background:"#ffcc44",filter:"blur(1.5px)",left:"76%",bottom:"34%",animation:"em2 4.1s ease-out 1.9s infinite"}} />
          <div style={{position:"absolute",width:"9px",height:"9px",borderRadius:"50%",background:"#ffcc44",filter:"blur(1.5px)",left:"18%",bottom:"12%",animation:"em3 2.4s ease-out 5.6s infinite"}} />
          <div style={{position:"absolute",width:"8px",height:"8px",borderRadius:"50%",background:"#ffcc44",filter:"blur(1.5px)",left:"80%",bottom:"27%",animation:"em4 3.7s ease-out 4.1s infinite"}} />
          <div style={{position:"absolute",width:"13px",height:"13px",borderRadius:"50%",background:"#ffaa22",filter:"blur(1.5px)",left:"7%",bottom:"35%",animation:"em5 4.2s ease-out 3.5s infinite"}} />
          <div style={{position:"absolute",width:"9px",height:"9px",borderRadius:"50%",background:"#ffdd66",filter:"blur(1.5px)",left:"25%",bottom:"28%",animation:"em6 4.9s ease-out 0.4s infinite"}} />
          <div style={{position:"absolute",width:"14px",height:"14px",borderRadius:"50%",background:"#ffcc44",filter:"blur(1.5px)",left:"79%",bottom:"20%",animation:"em7 2.3s ease-out 4.2s infinite"}} />
          <div style={{position:"absolute",width:"10px",height:"10px",borderRadius:"50%",background:"#ffcc44",filter:"blur(1.5px)",left:"63%",bottom:"28%",animation:"em8 3.9s ease-out 5.1s infinite"}} />
          <div style={{position:"absolute",width:"12px",height:"12px",borderRadius:"50%",background:"#ffcc44",filter:"blur(1.5px)",left:"24%",bottom:"23%",animation:"em9 3.2s ease-out 5.9s infinite"}} />
          <div style={{position:"absolute",width:"11px",height:"11px",borderRadius:"50%",background:"#ffcc44",filter:"blur(1.5px)",left:"5%",bottom:"11%",animation:"em10 2.1s ease-out 4.7s infinite"}} />
          <div style={{position:"absolute",width:"9px",height:"9px",borderRadius:"50%",background:"#ffdd66",filter:"blur(1.5px)",left:"81%",bottom:"16%",animation:"em11 3.9s ease-out 4.9s infinite"}} />
          <div style={{position:"absolute",width:"6px",height:"6px",borderRadius:"50%",background:"#ffee88",filter:"blur(1.5px)",left:"13%",bottom:"9%",animation:"em12 3.7s ease-out 5.9s infinite"}} />
          <div style={{position:"absolute",width:"13px",height:"13px",borderRadius:"50%",background:"#ffdd66",filter:"blur(1.5px)",left:"14%",bottom:"13%",animation:"em13 4.2s ease-out 1.2s infinite"}} />
          <div style={{position:"absolute",width:"10px",height:"10px",borderRadius:"50%",background:"#ffee88",filter:"blur(1.5px)",left:"46%",bottom:"23%",animation:"em14 2.7s ease-out 2.9s infinite"}} />
          <div style={{position:"absolute",width:"14px",height:"14px",borderRadius:"50%",background:"#ffaa22",filter:"blur(1.5px)",left:"54%",bottom:"31%",animation:"em15 4.0s ease-out 3.3s infinite"}} />
          <div style={{position:"absolute",width:"11px",height:"11px",borderRadius:"50%",background:"#ff8800",filter:"blur(1.5px)",left:"17%",bottom:"14%",animation:"em16 4.4s ease-out 3.9s infinite"}} />
          <div style={{position:"absolute",width:"10px",height:"10px",borderRadius:"50%",background:"#ff8800",filter:"blur(1.5px)",left:"48%",bottom:"28%",animation:"em17 3.3s ease-out 3.0s infinite"}} />
          <div style={{position:"absolute",width:"8px",height:"8px",borderRadius:"50%",background:"#ff8800",filter:"blur(1.5px)",left:"37%",bottom:"19%",animation:"em18 4.4s ease-out 5.6s infinite"}} />
          <div style={{position:"absolute",width:"7px",height:"7px",borderRadius:"50%",background:"#ffee88",filter:"blur(1.5px)",left:"38%",bottom:"24%",animation:"em19 4.9s ease-out 1.8s infinite"}} />
          <div style={{position:"absolute",width:"14px",height:"14px",borderRadius:"50%",background:"#ffcc44",filter:"blur(1.5px)",left:"59%",bottom:"30%",animation:"em22 3.2s ease-out 4.9s infinite"}} />
          <div style={{position:"absolute",width:"12px",height:"12px",borderRadius:"50%",background:"#ffaa22",filter:"blur(1.5px)",left:"74%",bottom:"19%",animation:"em23 3.4s ease-out 5.5s infinite"}} />
          <div style={{position:"absolute",width:"5px",height:"5px",borderRadius:"50%",background:"#ffee88",filter:"blur(1.5px)",left:"81%",bottom:"17%",animation:"em25 4.8s ease-out 2.6s infinite"}} />
          <div style={{position:"absolute",width:"14px",height:"14px",borderRadius:"50%",background:"#ff8800",filter:"blur(1.5px)",left:"7%",bottom:"26%",animation:"em26 2.2s ease-out 2.0s infinite"}} />
          <div style={{position:"absolute",width:"10px",height:"10px",borderRadius:"50%",background:"#ffdd66",filter:"blur(1.5px)",left:"59%",bottom:"30%",animation:"em30 2.1s ease-out 3.5s infinite"}} />
          <div style={{position:"absolute",width:"11px",height:"11px",borderRadius:"50%",background:"#ffee88",filter:"blur(1.5px)",left:"34%",bottom:"14%",animation:"em31 4.2s ease-out 3.5s infinite"}} />
          <div style={{position:"absolute",width:"8px",height:"8px",borderRadius:"50%",background:"#ffaa22",filter:"blur(1.5px)",left:"51%",bottom:"28%",animation:"em37 3.4s ease-out 4.0s infinite"}} />
          <div style={{position:"absolute",width:"6px",height:"6px",borderRadius:"50%",background:"#ffee88",filter:"blur(1.5px)",left:"74%",bottom:"23%",animation:"em38 3.3s ease-out 2.3s infinite"}} />
          <div style={{position:"absolute",width:"14px",height:"14px",borderRadius:"50%",background:"#ffee88",filter:"blur(1.5px)",left:"64%",bottom:"11%",animation:"em39 3.1s ease-out 0.7s infinite"}} />
        </div>

        {/* Card */}
        <div className="fw-card-wrap">
          <div className="fw-card">
            {children}
          </div>
        </div>

      </div>
    </>
  );
}