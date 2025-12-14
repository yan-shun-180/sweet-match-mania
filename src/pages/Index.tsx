import CandyCrush from "@/components/CandyCrush";
import { Helmet } from "react-helmet";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Candy Crush - Match 3 Puzzle Game</title>
        <meta name="description" content="Play Candy Crush, a fun match-3 puzzle game. Swap candies to create matches and score points in endless or timed mode!" />
      </Helmet>
      <main>
        <CandyCrush />
      </main>
    </>
  );
};

export default Index;
