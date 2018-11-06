/*
 *  Copyright (c) 2017 Medium One, Inc
 *  www.mediumone.com
 *
 *  Portions of this work may be based on third party contributions.
 *  Medium One, Inc reserves copyrights to this work whose
 *  license terms are defined under a separate Software License
 *  Agreement (SLA).  Re-distribution of any or all of this work,
 *  in source or binary form, is prohibited unless authorized by
 *  Medium One, Inc under SLA.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 *  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 *  LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 *  FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 *  OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 *  SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 *  TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 *  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 *  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */


(function () {
    'use strict';

    angular
        .module('app.SettingsAndControl', ['app.device_data_service'])

        .controller('SettingsAndControl', ['$scope', '$http', '$state', 'DeviceDataService',

            function ($scope, $http, $state, DeviceDataService) {

                var vm = this;
                vm.device_id = $state.params.custom_param;

                // declare mappings of vm/controller function names to go to custom dashboard pages

                // e.g. calling vm.go_to_service_logs will go to the dashboard page 'servicelogs'
                var button_mapping = {
                  'go_to_service_logs': 'servicelogs',
                  'go_to_settings':   'settings',
                  'go_to_controls':     'controls',
                  'go_to_status':   'devicecurrentstatus',
                  'go_to_charts':       'chartsandhistory',
                  'go_to_camera':       'camera'
                };


                // install methods on controller vm object for navigation buttons
                Object.keys(button_mapping).forEach(function(key) {
                    var custom_page_name = button_mapping[key];
                  vm[key] = function() {
                      $state.go('app.M1DashboardController.detail.withParam', {
                            page_name:    custom_page_name,
                            custom_param: vm.device_id
                        });
                    }
                });

                vm.photo = "";
              
                vm.cam_xpos = 0;
                vm.cam_ypos = 0;
                vm.cam_xpos_invalid = false;
                vm.cam_ypos_invalid = false;

                vm.send_photo_request = function() {
                    DeviceDataService.create_event

                     DeviceDataService.create_event({
                            'device_id': vm.device_id,
                            'stream': 'raw',
                            'event_data': {'capture_photo': true}
                        }).then(
                            function(response) {
                            },
                            function(error) {
                                console.log("error capture photo send: ", error);
                                //SweetAlert.swal("Error refreshing sensors");
                            }
                        );
                }


                vm.send_camera_xpos = function() {
                    if (parseInt(vm.cam_xpos, 10) >= -4 && parseInt(vm.cam_xpos, 10) <= 4) {
                     vm.cam_xpos_invalid = false;
                     DeviceDataService.create_event
                     DeviceDataService.create_event({
                            'device_id': vm.device_id,
                            'stream': 'raw',
                            'event_data': {'cam_xpos': parseInt(vm.cam_xpos, 10)}
                        }).then(
                            function(response) {
                            },
                            function(error) {
                                console.log("error camera x position send: ", error);
                                //SweetAlert.swal("Error refreshing sensors");
                            }
                        );
                    } else {
                      vm.cam_xpos_invalid = true;
                    }
                }


               vm.send_camera_ypos = function() {
                    if (parseInt(vm.cam_ypos, 10) >= -4 && parseInt(vm.cam_ypos, 10) <= 4) {
                      vm.cam_ypos_invalid = false;
                      DeviceDataService.create_event
                      DeviceDataService.create_event({
                            'device_id': vm.device_id,
                            'stream': 'raw',
                            'event_data': {'cam_ypos': parseInt(vm.cam_ypos, 10) * -1}  // Need to reciprocal.
                        }).then(
                            function(response) {
                            },
                            function(error) {
                                console.log("error camera y position send: ", error);
                                //SweetAlert.swal("Error refreshing sensors");
                            }
                        );
                    } else {
                      vm.cam_ypos_invalid = true;
                    }
                }

             
                // Added by DT to handle photos
                DeviceDataService.device_last_value({
                  'device_id': vm.device_id,
                  'tags':      ['raw.photo']
                }).then(handle_photo_data,
                  function(error) {
                    console.log("error loading photo image information: ", error);
                    bind_relay_watcher();
                  }

                );
              
                var base64img = "";
                function Base64ToImage(base64img, callback) {
                    var img = new Image();
                    img.onload = function() {
                        callback(img);
                    };
                    img.src = base64img;
                }
                function handle_photo_data(response) {
                    if (response.values.hasOwnProperty('raw.photo')) {
                        //console.log("Photo response: "+response.values['raw.photo']);
                        base64img = "data:image/png;base64,"+response.values['raw.photo'];
                        Base64ToImage(base64img, function(img) {
                          document.getElementById('canvas').appendChild(img);
                          var log = "w=" + img.width + " h=" + img.height;
                          document.getElementById('photo').value = log;
                        });
                    }
                }
               
              // Added by ML to handle capture_photo_event_msg
                DeviceDataService.device_last_value({
                  'device_id': vm.device_id,                  
                  'tags':      ['raw.photo_event_msg']
                }).then(handle_photo_event_msg,
                  function(error) {
                    console.log("error loading photo event message information: ", error);
                    bind_relay_watcher();
                  }

                );

                function handle_photo_event_msg(response) {
                    if (response.values.hasOwnProperty('raw.photo_event_msg')) {
                        vm.msg = response.values['raw.photo_event_msg'];                        
                    }
                  }

                // Added by ML to handle capture_photo_success
                DeviceDataService.device_last_value({
                  'device_id': vm.device_id,                  
                  'tags':      ['raw.photo_capture_success']
                }).then(handle_photo_success,
                  function(error) {
                    console.log("error loading relay information: ", error);
                    bind_relay_watcher();
                  }

                );

                function handle_photo_success(response) {
                    if (response.values.hasOwnProperty('raw.photo_capture_success')) {
                        var successflag = response.values['raw.photo_capture_success'];                       
                        if (successflag) {
                          console.log("<b>Picture shot is successful.</b>");
                          vm.msg2 = "Picture shot is successful."; 
                        } else {
                          console.log("<b>Camera is not connected to the board.</b>");
                          vm.msg2 = "Camera is not connected to the board.";
                        }
                    }
                }
                
                              // Added by ML to handle capture_photo_event_msg
                DeviceDataService.device_last_value({
                  'device_id': vm.device_id,                  
                  'tags':      ['raw.cam_xpos']
                }).then(handle_camera_x_position,
                  function(error) {
                    console.log("error loading camera's x position information: ", error);
                    bind_relay_watcher();
                  }

                );

                function handle_camera_x_position(response) {
                    if (response.values.hasOwnProperty('raw.cam_xpos')) {
                        vm.cam_xpos = response.values['raw.cam_xpos'].toString();                        
                    }
                  }

                              // Added by ML to handle capture_photo_event_msg
                DeviceDataService.device_last_value({
                  'device_id': vm.device_id,                  
                  'tags':      ['raw.cam_ypos']
                }).then(handle_camera_y_position,
                  function(error) {
                    console.log("error loading camera's y position information: ", error);
                    bind_relay_watcher();
                  }

                );

                function handle_camera_y_position(response) {
                    if (response.values.hasOwnProperty('raw.cam_ypos')) {
                        vm.cam_ypos = response.values['raw.cam_ypos'].toString();                        
                    }
                  }

            }]);
})();