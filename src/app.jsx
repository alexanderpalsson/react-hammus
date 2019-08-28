import React, {useMemo, useRef } from "react";
import enigma from "enigma.js";
import schema from "enigma.js/schemas/12.170.2.json";
import picasso from "picasso.js";
import picassoQ from "picasso-plugin-q";
import usePromise from "react-use-promise";
import { useModel, useLayout, usePicasso } from "./hamus/index";

const object = {
  qInfo: {
    qType: "measure",
    qId: "barChartExample"
  },
  type: "my-picasso-barChart",
  qHyperCubeDef: {
    qDimensions: [
      {
        labels: true,
        qDef: {
          qFieldDefs: ["Rating"],
          qSortCriterias: [
            {
              qSortByAscii: 1
            }
          ]
        }
      }
    ],
    qMeasures: [
      {
        labels: true,
        qDef: {
          qLabel: "Votes",
          qDef: "Votes",
          autoSort: true
        }
      }
    ],
    qInitialDataFetch: [
      {
        qHeight: 15,
        qWidth: 2
      }
    ]
  }
};

const chartSettings = {
  scales: {
    labels: "true",
    y: {
      data: { field: "Votes" },
      invert: true,
      include: [0]
    },

    t: { data: { extract: { field: "Rating" } }, padding: 0.3 }
  },
  components: [
    {
      type: "axis",
      dock: "left",
      scale: "y"
    },
    {
      type: "axis",
      dock: "bottom",
      scale: "t"
    },
    {
      key: "bars",
      type: "box",
      data: {
        extract: {
          field: "Rating",
          props: {
            start: 0,
            end: { field: "Votes" }
          }
        }
      },
      settings: {
        major: { scale: "t" },
        minor: { scale: "y" }
      }
    },
    {
      type: "text",
      text: "Rating Score",
      layout: {
        dock: "bottom"
      }
    },
    {
      type: "text",
      text: "Number of Votes",
      layout: {
        dock: "left"
      }
    }
  ]
};

const loadscript = `Stars:
LOAD * INLINE 
[
Rating,Votes,
10,3404,
9,2234,
8,6243,
7,13785,
6,20325,
5,18046,
4,10179,
3,5844,
2,3244,
1,3208
];`;

const useGlobal = session => usePromise(() => session.open(), [session]);

function useSessionApp(QIX) {
  const [sessionApp] = usePromise(async () => {
    if (!QIX) return null;
    const app = await QIX.createSessionApp();
    await app.setScript(loadscript);
    await app.doReload();
    return app;
  }, [QIX]);
  return sessionApp;
}

// we need to register the q plugin in order for picasso to understand the QIX hypercube.
picasso.use(picassoQ);

export default function App() {
  // we need to keep track of an element reference for the picasso chart.
  const element = useRef(null);
  // we need to use the useMemo hook to avoid creating new enigma.js sessions each time.
  const session = useMemo(
    () => enigma.create({ schema, url: `ws://localhost:9076/app/enginedata/identity/${Date.now()}` }),
    [false]
  );
  // open the session.
  const [QIX] = useGlobal(session);
  // create session app, set load script and reload.
  const app = useSessionApp(QIX);
  // fetch the model
  const [model, modelError] = useModel(app, object);
  // fetch the layout.
  const [layout, layoutError] = useLayout(model);
  // render picasso chart.
  usePicasso(element, chartSettings, layout);

  let msg = "";
  if (!app) {
    msg = "Fetching app...";
  } else if (modelError) {
    msg = "Oops, there was some problems fetching the model";
  } else if (layoutError) {
    msg = "Oops, there was some problems fetching the layout";
  } else if (!layout) {
    msg = "Fetching layout...";
  }

  return (
    <div className="chart">
      <div ref={element}>{msg}</div>
    </div>
  );
}
