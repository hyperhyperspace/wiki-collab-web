import { Button, Typography } from "@mui/material";
import Launcher from "../Launcher";
import { Identity, MutableArray, RSAKeyPair } from "@hyper-hyper-space/core";
import { WikiSpace } from "@hyper-hyper-space/wiki-collab";
import { useNavigate } from "react-router";


export default function SpaceLauncher(props: { visible: boolean, launcher: Launcher }) {
  const { launcher } = props;
  async function newSpace() {
    const kp = await RSAKeyPair.generate(2048);

    const creator = Identity.fromKeyPair({}, kp);
    console.log('Generated wiki creator', creator);
    const space = await new WikiSpace([creator].values());
    //await space.init(); <-- this get called on the constructor automatically :-)
    
    const spaceStore = await Launcher.initSpaceStore(space);
    space.setStore(spaceStore);
    
    const spaceResources = await Launcher.initSpaceResources(space);
    space.setResources(spaceResources);

    await space.title?.setValue('Unnamed wiki');
    await space.createWelcomePage("your new wiki", creator);

    space.save();

    launcher.spaces?.push(space, launcher.getAuthor()!);
    await launcher.spaces?.save();
    await launcher.save();
    console.log('new space', launcher.spaces, space, launcher.getAuthor());
  }
  
  const navigate = useNavigate();

  return <>
    { props.visible && <div>
      <Button onClick={newSpace}>New space...</Button>
      <h5>or</h5>
      <Typography
        variant="button"
      >Open a saved space...</Typography>
      <ul>
        {[...(launcher.spaces as MutableArray<WikiSpace>).values()].map((space) => {
          return <li key={space.getLastHash()}>
            <Button
              onClick={() => {
                navigate('/space/' + encodeURIComponent(space.getLastHash()));
              }}
            >{space.getLastHash()}</Button>
          </li>;
        })}
      </ul>
      <h5>or</h5>
      <Button>
        Import an existing space...
      </Button>
    </div> }
  </>;
}
