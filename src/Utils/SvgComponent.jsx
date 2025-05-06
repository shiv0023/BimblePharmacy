import * as React from "react"
import Svg, { Circle, Path } from "react-native-svg"

function TickIcon(props) {
  return (
    <Svg
      clipRule="evenodd"
      fillRule="evenodd"
      height={30}
      imageRendering="optimizeQuality"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      viewBox="0 0 2.54 2.54"
      width={20}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Circle cx={1.27} cy={1.27} fill="#00ba00" r={1.27} />
      <Path
        d="M.873 1.89L.41 1.391a.17.17 0 01.008-.24.17.17 0 01.24.009l.358.383.567-.53a.17.17 0 01.016-.013l.266-.249a.17.17 0 01.24.008.17.17 0 01-.008.24l-.815.76-.283.263-.125-.134z"
        fill="#fff"
      />
    </Svg>
  )
}

export default TickIcon
