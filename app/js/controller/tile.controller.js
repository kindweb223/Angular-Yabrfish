/**=========================================================
 * Module: tileController
 * Description: Controller for My Tiles
 * Author: Ryan - 2015.11.20
 =========================================================*/
(function() {
    'use strict';

    angular
        .module('app.tiles', ['ngAnimate', 'ui.bootstrap', 'ui.select', 'ngFileUpload', 'stripe.checkout', 'flash', 'angular-datepicker'])
        .controller('tileController', tileController);

    function tileController($scope, $http, $rootScope, RouteHelpers, APP_APIS, Upload, TileService, ProductService, Flash) {
      $scope.tiles = [];
      $scope.basepath = RouteHelpers.basepath;
      $scope.tileTypes = [];
      $scope.tileType = {};
      $scope.newTile = {
        title: '',
        description: '',
        tileType: '',
        accountExternalId: '',
        organizationExternalId: ''
      };
      $scope.accounts = [];
      $scope.account = {};
      $scope.organizations = [];
      $scope.organization = {};
      $scope.diffInstances = 0;
      $scope.enablement = false;
      $scope.enableCreate = true;
      $scope.showNewTile = false;

      // Get Tile Types
      $http.get(APP_APIS['lookup']+'/tiletypes')
        .success(function(data){
          $scope.tileTypes = data;
        })
        .error(function(status){
          console.log(status);
        })

      // Slide Tile Creation Steps.
      var step_count = 3;
      $scope.stepWidth = angular.element('.new-tile-wrap').width();
      $scope.sliderWidth = angular.element('.new-tile-wrap').width() * step_count;
      $scope.transform = '';
      var translate = 0;
      $scope.index = 0;

      $scope.slideWrap = function(dir){
        if(dir === 'next'){
          $scope.index ++;
          translate -= $scope.stepWidth;
          $scope.transform = "translate("+translate+"px, 0px)";
        }else{
          $scope.index --;
          translate += $scope.stepWidth;
          $scope.transform = "translate("+translate+"px, 0px)";
        }
      }
      
      // Preview upload Image.
      $scope.setFile = function(element) {
        $scope.currentFile = element.files[0];
         var reader = new FileReader();

        reader.onload = function(event) {
          $scope.image_source = event.target.result
          $scope.$apply()

        }
        // when the file is read it triggers the onload event above.
        reader.readAsDataURL(element.files[0]);
      }
      
      if(!$rootScope.user)
        return;
      
      // Get Current User's Roles
      $http.get(APP_APIS['commerce']+'/viewers/'+$rootScope.user.externalId+'/roles')
        .success(function(data){
          for(var i in data){            
            $scope.accounts.push(data[i].account);
          }
          $scope.accounts.unshift({
            name: 'Just For Me'
          });
        });

      $scope.changeAccount = function(item){        
        $scope.organizations = item.organizations;
        var accountId = item.externalId;
        var accountName = item.name;

        if (accountName == 'Just For Me'){
          $scope.enablement = true;
        }else{
          // Get Enablements.
          $http.get(APP_APIS['commerce']+'/accounts/'+accountId+'/enablements?productType=Tiles')
            .success(function(data){
              var enablements = data;
              var maxInstances = 0;
              var instanceCounts = 0;

              for(var i in enablements){
                maxInstances += enablements[i].maximumInstances;
                instanceCounts += enablements[i].instanceCount;
              }

              $scope.diffInstances = maxInstances - instanceCounts;
              if($scope.diffInstances > 0)
                $scope.enablement = true;
              else
                $scope.enablement = false;
            });
        }        
      }

      $scope.createTile = function() {
        $scope.enableCreate = false;
        if(!$scope.currentFile){
          Flash.create('danger', 'Please select an image.');
          $scope.slideWrap('prev');
          return;
        }

        if(Object.keys($scope.tileType).length == 0){
          Flash.create('danger', 'Please select tile type.');
          $scope.slideWrap('prev');
          return;
        } 
        else{
          $scope.newTile.tileType = $scope.tileType.selected.shortCode;
          $scope.newTile.tileType = $scope.newTile.tileType.toUpperCase();
        }

        if(!$scope.newTile.title || $scope.newTile.title == ''){
          Flash.create('danger', 'Please input title.');
          $scope.slideWrap('prev');
          return;
        }

        if(!$scope.newTile.description || $scope.newTile.description == ''){
          Flash.create('danger', 'Please input description.');
          $scope.slideWrap('prev');
          return;
        }
        
        if(!$rootScope.user.externalId) $rootScope.user.externalId = '';        

        if(Object.keys($scope.account).length == 0) 
          $scope.newTile.accountExternalId = null;
        else
          $scope.newTile.accountExternalId = $scope.account.selected.externalId;

        if(Object.keys($scope.organization).length == 0) 
          $scope.newTile.organizationExternalId = null;
        else
          $scope.newTile.organizationExternalId = $scope.organization.selected.externalId;

        // File Upload
        var creativesExternalId = '';
        var params = {
          "description": $scope.newTile.description,
          "name": $scope.newTile.title,
          "accountExternalId": $scope.newTile.accountExternalId,
          "tileType": $scope.newTile.tileType,
          "organizationExternalId": $scope.newTile.organizationExternalId,
          "viewerExternalId": $rootScope.user.externalId
        };
        Upload.upload({
            url: APP_APIS['media'] + '/images',
            data: {file: $scope.currentFile},
            headers: {'Content-Range': 'bytes 42-1233/*'}
        }).then(function (resp) {
            creativesExternalId = resp.data.externalId;
            $http({
              method: 'POST',
              url: APP_APIS['tile'] + '/tiles',
              data: JSON.stringify(params),
              headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config){
              var tileId = data.externalId;
              $scope.newTile = data;
console.log($scope.newTile);              
              $scope.newTile.creatives = [];
              // Add Creatives to Given Tile
              $http.post(APP_APIS['tile'] + '/tiles/' + tileId + '/creatives/' + creativesExternalId)
                .success(function(response){
                  $scope.showNewTile = true;
                  $scope.newTile.creatives.push(response);
                  $scope.newTile.publishedDate = TileService.getTimeDiff($scope.newTile.publishedDate);
                  $scope.slideWrap('next');                  
                  Flash.create('success', 'Successfully created new tile.');
                  $scope.enableCreate = true;
                });
            }).error(function (data, status, headers, config){
              console.log('Error status: ' + resp.status);
              Flash.create('danger', 'Error! Cannot create new tile.');
              $scope.enableCreate = true;
            })
        }, function (resp) {
            console.log('Error status: ' + resp.status);
            Flash.create('danger', 'Error! Cannot create new tile.');
            $scope.enableCreate = true;
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
        });        
      }

      // Get My Tiles.
      $scope.getTiles = function() {
        $http.get(APP_APIS['tile']+'/tiles/owners?viewerExternalId='+ $rootScope.user.externalId)
          .success(function(tiles){
            $scope.tiles = tiles.tileList;
            for(var i in $scope.tiles){
              //Get and change lowercase Tile Type.              
              $scope.tiles[i].tileType = $scope.tiles[i].tileType.toLowerCase();
              $scope.tiles[i].publishedDate = TileService.getTimeDiff($scope.tiles[i].publishedDate);
            }
            console.log($scope.tiles);
          })
      }

      // Get Products of type = Tiles
      ProductService.getProducts('tiles').then(function(products){
        $scope.products = products;
      })

      $scope.selectOffer = function(offer) {
        $scope.selected = offer;
        $scope.offerDescription = offer.description;
        $scope.offerAmount = offer.grossPrice * 100;
        $scope.offerName = offer.name;
      }

      $scope.isSelected = function(offer) {
        return $scope.selected === offer;
      }

      $scope.doCheckout = function(token) {
        console.log(token.id);
      }

      // Get Event Tile Type
      $http.get(APP_APIS['lookup']+'/eventtypes')
        .success(function(eventtypes){
          $scope.eventtypes = eventtypes;
        });

      $scope.options = {
        format: 'yyyy-mm-dd', // ISO formatted date
        onClose: function(e) {
          // do something when the picker closes   
        }
      }
    }
})();