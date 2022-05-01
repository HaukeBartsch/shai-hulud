# Shai-Hulud the sandworm

A simple surgical simulator data generator (application). Build to generate images for deep learning. Such simulators are great because they can generate an arbitrary number of (ground-truth) sample data.

![Example generated surface](/images/WormSurface.png "Example surface")

![Example stone](/images/Stone.png "Example surface for stone structure")

Both of the above surfaces have been created de-novo using the provided python scripts.

Here an example rendering (using the viewer/ application) that shows the tube geometry (smooth shading) with an additional wireframe geometry (to see the quality of the mesh) and a stone geometry embedded into the wall.

![Example surface rendered with stone](/images/WormStone.png "Example combined surface and stone geometry")

We can now render a video sequence with a spotlight attached to the camera.

![Video sequence](/images/animation.gif "Video sequence with wireframe and stone")

In the same way that we can render the 'realistic' image we can also render the depth map from the same camera point for both the tube and the stone surface.

Here an example of both the image and its depth map:

![Example rendered with stone](/images/DepthMapLinkedImage.png "Example surface and stone geometry")
![Corresponding depth map](/images/DepthMap.png "Example depth map (bright mean closer to the camera)")

In order to see the differences in sucdessive runs of the stone generation algorithm here a montage of stone shapes where we only varied the 'numCells' paramater between 30 and 10,000.

![Examples for stone shapes](/images/Stones.png "Examples for stone geometry surfaces")
