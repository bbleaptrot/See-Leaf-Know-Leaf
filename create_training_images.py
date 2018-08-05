'''
Takes an image of a leaf and its segmented picture, scales and rotates them randomly. 
Crops the images down to the smallest rectangle based on the segmented image.
The transformed leaf segment is drawn on a random background image section.

This is repeated for each leaf in the leaf-snap dataset.
'''
import csv, os
from PIL import Image, ImageDraw
from random import random, choice

#define a function to create a new folder if one does not exist.
def touch(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

#detect if a pixel is white. cleans up the segment edges
def is_white(pixel):
    if pixel[0] < 125 :
        return False
    elif pixel[1] < 125 :
        return False
    elif pixel[2] < 125 :
        return False
    else:
        return True

def make_new_image(leaf, segmented, background) :
        
    #load images, create new segmented image
    leaf_image = Image.open(leaf)
    seg_image = Image.open(segmented)
    background_image = Image.open(background)

    #crop background image to be 1000x1200 pixels this is a realistic ratio
    crop_x = int(random()*(background_image.size[0]-1000))
    crop_y = int(random()*(background_image.size[1]-1200))
    background_image = background_image.crop((
        crop_x,
        crop_y,
        crop_x + 1000,
        crop_y + 1200
    ))

    #rotate leaf and segmented randomly
    rand_angle = 360*random()
    leaf_image = leaf_image.rotate(rand_angle)
    seg_image = seg_image.rotate(rand_angle)

    #randomly scale the images between 85% and 115% of the original size
    rand_scale = (0.85+0.3*random())
    new_size = tuple([int(rand_scale*x) for x in leaf_image.size])
    leaf_image = leaf_image.resize(new_size)
    seg_image = seg_image.resize(new_size)

    #crop the images so that only the leaf is visible
    bounds = seg_image.getbbox()
    leaf_image = leaf_image.crop(bounds)
    seg_image = seg_image.crop(bounds)

    #find a valid starting pixel to begin inserting the leaf
    init_x = int(random()*(background_image.size[1]-seg_image.size[1]))
    init_y = int(random()*(background_image.size[0]-seg_image.size[0]))

    #Create new segmented image
    new_seg_image = Image.new('1',background_image.size)

    #access pixel maps
    bkgrnd_pix = background_image.load()
    seg_pix = seg_image.load()
    leaf_pix = leaf_image.load()
    new_seg_pix = new_seg_image.load()

    #write only the leaf segment to background, avoid white edges
    for y in range(0,seg_image.size[0]):
        for x in range(0, seg_image.size[1]):
            if seg_pix[y,x] != 0 and not is_white(leaf_pix[y,x]) :
                bkgrnd_pix[init_y+y,init_x+x] = leaf_pix[y,x]
                new_seg_pix[init_y+y,init_x+x] = 1

    return background_image, new_seg_image


#read the leafsnap dataset and create a ton of images

with open('../leafsnap-dataset/leafsnap-dataset-images.txt') as tsvfile,open('segmentation_images.csv', 'w') as csvfile:
    reader = csv.reader(tsvfile, delimiter='\t')
    writer = csv.writer(csvfile)

    writer.writerow(['leaf_image', 'segmented_image','species'])

    row_num = 0
    for row in reader:
        if row_num > 0 and row[4] == 'field':
            leaf_path = '../leafsnap-dataset/'+row[1]
            seg_path = '../leafsnap-dataset/'+row[2]
            species = row[3]

            new_bkgrnd = 'Backgrounds/'+choice(os.listdir('Backgrounds/'))

            leaf, seg = make_new_image(leaf_path,seg_path,new_bkgrnd)

            new_leaf = 'Images/'+ species.replace(' ','_') +'/leaf_image_'+str(row_num)+'.png'
            new_seg ='Segmented/'+ species.replace(' ','_')+'/seg_image_'+str(row_num)+'.png'

            touch('Images/'+ species.replace(' ','_'))
            leaf.save(new_leaf)

            touch('Segmented/'+ species.replace(' ','_'))
            seg.save(new_seg)

            writer.writerow([new_leaf,new_seg,species])

            print("image "+str(row_num)+" created")
        
        row_num = row_num + 1
