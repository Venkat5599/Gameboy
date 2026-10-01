import { Composition } from "remotion";
import { Film } from "./Film";
import { DURATION, FPS } from "./timeline";

export function Root() {
  return <Composition id="Scrappy" component={Film} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />;
}
