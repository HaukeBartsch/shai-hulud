# Shai-Hulud the sandworm

A simple surgical simulator data generator (application). Build to generate images for deep learning. Such simulators are great because they can generate an arbitrary number of (ground-truth) sample data.

![Example generated surface](/images/WormSurface.png "Example surface")

![Example stone](/images/Stone.png "Example surface for stone structure")

Both of the above surfaces have been created de-novo using the provided python scripts.

Here an example rendering (using the viewer/ application) that shows the tube geometry (smooth shading) with an additional wireframe geometry (to see the quality of the mesh) and a stone geometry embedded into the wall.

![Example surface rendered with stone](/images/WormStone.png "Example combined surface and stone geometry")

We can now render a video sequence with a spotlight attached to the camera.

![Video sequence](/images/animation.gif "Video sequence with wireframe and stone")
