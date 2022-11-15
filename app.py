#!/usr/bin/env python

from flask import Flask, render_template, jsonify, Response
import cv2
import os
import sys, getopt
import signal
import time
from edge_impulse_linux.image import ImageImpulseRunner

if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    app = Flask(__name__)
#app = Flask(__name__)

#--------------------------------------------------------------------------
# Variables that store the counts of people detected at each cashier
#--------------------------------------------------------------------------
customers_numbers = {
    "cashier1":0,
    "cashier2":0,
    "cashier3":0,
}
#--------------------------------------------------------------------------


runner = None
# if you don't want to see a camera preview, set this to False
show_camera = True
if (sys.platform == 'linux' and not os.environ.get('DISPLAY')):
    show_camera = False

def now():
    return round(time.time() * 1000)

def get_webcams():
    port_ids = []
    for port in range(10):
        print("Looking for a camera in port %s:" %port)
        camera = cv2.VideoCapture(port)
        if camera.isOpened():
            ret = camera.read()[0]
            if ret:
                backendName =camera.getBackendName()
                w = camera.get(3)
                h = camera.get(4)
                print("Camera %s (%s x %s) found in port %s " %(backendName,h,w, port))
                port_ids.append(port)
            camera.release()
    return port_ids

def sigint_handler(sig, frame):
    print('Interrupted')
    if (runner):
        runner.stop()
    sys.exit(0)

signal.signal(signal.SIGINT, sigint_handler)

def help():
    print('python classify.py <path_to_model.eim> <Camera port ID, only required when more than 1 camera is present>')

def main():
    dir_path = os.path.dirname(os.path.realpath(__file__))
    modelfile = os.path.join(dir_path, 'modelfile/' ,'modelfile.eim')

    print('MODEL: ' + modelfile)

    with ImageImpulseRunner(modelfile) as runner:
        try:
            model_info = runner.init()
            print('Loaded runner for "' + model_info['project']['owner'] + ' / ' + model_info['project']['name'] + '"')
            labels = model_info['model_parameters']['labels']
            
            camera = cv2.VideoCapture(0)
            ret, frame = camera.read()

            #frame = cv2.resize(frame, (640, 640), interpolation = cv2.INTER_LINEAR)
            
            ret = camera.read()
            if ret:
                backendName = camera.getBackendName()
                w = camera.get(3)
                h = camera.get(4)
                print("Camera %s (%s x %s) in port %s selected." %(backendName,h,w, 0))
                camera.release()
            else:
                raise Exception("Couldn't initialize selected camera.")

            next_frame = 0 # limit to ~10 fps here

            for res, img in runner.classifier(0):
                if (next_frame > now()):
                    time.sleep((next_frame - now()) / 1000)
                
                # get dimensions of image
                dimensions = img.shape
                # height, width, number of channels in image
                height = img.shape[0]
                width = img.shape[1]
                channels = img.shape[2]
                
                print('Image Dimension    : ',dimensions)
                print('Image Height       : ',height)
                print('Image Width        : ',width)
                print('Number of Channels : ',channels)

                # print('classification runner response', res)
                if "classification" in res["result"].keys():
                    print('Result (%d ms.) ' % (res['timing']['dsp'] + res['timing']['classification']), end='')
                    for label in labels:
                        score = res['result']['classification'][label]
                        print('%s: %.2f\t' % (label, score), end='')
                    print('', flush=True)

                elif "bounding_boxes" in res["result"].keys():
                    print('Found %d bounding boxes (%d ms.)' % (len(res["result"]["bounding_boxes"]), res['timing']['dsp'] + res['timing']['classification']))
                    for bb in res["result"]["bounding_boxes"]:
                        print('\t%s (%.2f): x=%d y=%d w=%d h=%d' % (bb['label'], bb['value'], bb['x'], bb['y'], bb['width'], bb['height']))
                        cv2.rectangle(img, (bb['x'], bb['y']), (bb['x'] + bb['width'], bb['y'] + bb['height']), (255, 0, 0), 1)

                        #--------------------------------------------------------------------------
                        # Determine the number of bounding boxes seen for customers at each cashier
                        #--------------------------------------------------------------------------
                        # change this x values accordingly
                        if(bb['x']>=12 and bb['x']<=105):
                            customers_numbers["cashier1"] +=1
                        elif(bb['x']>=205 and bb['x']<=333):
                            customers_numbers["cashier2"] +=1
                        elif(bb['x']>=420 and bb['x']<=525):
                            customers_numbers["cashier3"] +=1

                """
                #--------------------------------------------------------------------------
                # Draw lines for the checkout lines and display cashier numbers
                #--------------------------------------------------------------------------       
                # change this x values accordingly
                font = cv2.FONT_HERSHEY_SIMPLEX
                fontScale = 0.55
                fontColor = (0, 255, 0)
                fontThickness = 2
                cv2.putText(img,"Cashier 1", (20,50), font, fontScale, fontColor, fontThickness, cv2.LINE_AA)
                cv2.putText(img,"Cashier 2", (225,50), font, fontScale, fontColor, fontThickness, cv2.LINE_AA)
                cv2.putText(img,"Cashier 3", (438,50), font, fontScale, fontColor, fontThickness, cv2.LINE_AA)

                # change this x values accordingly
                #From the left of the image,
                # Draw Line 1 (far left)
                cv2.rectangle(img, (12, 50), (12, 620),
                            (0, 255, 0), 4)
                # Cashier 1 customers are here
                # Draw Line 2
                cv2.rectangle(img, (105, 50), (105, 620),
                            (0, 255, 0), 4)

                # Draw Line 3
                cv2.rectangle(img, (205, 50), (205, 620),
                            (0, 255, 0), 4)
                # Cashier 2 customers are here
                # Draw Line 4
                cv2.rectangle(img, (333, 50), (333, 620),
                            (0, 255, 0), 4)

                # Draw Line 5
                cv2.rectangle(img, (420, 50), (420, 620),
                            (0, 255, 0), 4)
                # Cashier 3 customers are here
                # Draw Line 6 (far right)
                cv2.rectangle(img, (525, 50), (525, 620),
                            (0, 255, 0), 4)
                #--------------------------------------------------------------------------
                """

                ret, buffer = cv2.imencode('.jpg', img=cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
                img = buffer.tobytes()
                yield (b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n' + img + b'\r\n')
              
                next_frame = now() + 100

        finally:
            if (runner):
                runner.stop()


@app.route('/')
def index():
    # video streaming home page
    return render_template('index.html')


@app.route('/video_feed')
def video_feed():
    return Response(main(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/get_cashier_customers') # returns customer numbers
def get_cashier_customers():
    return jsonify(customers_numbers)

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
