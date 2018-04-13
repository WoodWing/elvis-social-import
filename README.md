# Table of contents

<!-- 
  This TOC is auto-generated using markdown-toc: https://github.com/jonschlinkert/markdown-toc 
  If you introduce new or change existing chapters, please regenerate the TOC before committing.

  Command to regenerate (save any changes to README.md first):

  $ markdown-toc README.md -i
-->

<!-- toc -->

- [1. Introduction](#1-introduction)
- [2. Package details](#2-package-details)
- [3. Installation prerequisites](#3-installation-prerequisites)
- [4. Installation steps](#4-installation-steps)
  * [4.1 Configure Elvis metadata fields](#41-configure-elvis-metadata-fields)
  * [4.2 Install the social import server](#42-install-the-social-import-server)
  * [4.3 Install the Twitter plug-ins](#43-install-the-twitter-plug-ins)
- [5. Usage & validate installation](#5-usage--validate-installation)
- [6. Privacy and data usage](#6-privacy-and-data-usage)
- [7. Version history](#7-version-history)
  * [v1.0.0](#v100)

<!-- tocstop -->

# 1. Introduction

The Elvis social import integration imports media files from social networks. It currently supports importing images from Twitter and is best combined with the [Elvis AI integration](https://github.com/WoodWing/elvis-image-recognition). With AI, images are automatically tagged allowing you to better find relevant images. 

This readme describes how to setup the integration. Please checkout this [webinar](https://www.woodwing.com/en/learning-center/on-demand-webinars/winning-in-journalism-aided-by-ai-and-crowdsourcing) if you want to know more about how to use cases and usage.

# 2. Package details

The integration consist of several components. The main component is the social import server app. This nodejs based server app handles all communication between Elvis and Twitter. The integration uses the Twitter streaming API, which allows us to register keywords (hashtags) we want to get Twitter images for. This is a live feed, so whenever a someone tweets an image, our integration is informed by Twitter and we can start importing the image into Elvis.

The second component is an Elvis web client plug-in. The Twitter panel plugin allows to manage topics. Each topic has one or multiple keywords to search for and links to a folder in Elvis where the images are stored.

# 3. Installation prerequisites

- Fully installed and licensed [Elvis Server](https://www.woodwing.com/en/digital-asset-management-system). 
- Minimum required version is Elvis 6.7.
- Machine where the social import server can run. This can be on the same machine where the Elvis Server runs or a different machine. Currently supported operating systems are Linux and OSX.
- Elvis API user license.
- A Twitter account.

# 4. Installation steps

This readme describes the high level installation steps. Detailed configuration information is embedded in the various configuration files. 

## 4.1 Configure Elvis metadata fields

The integration uses both standard and custom Elvis metadata fields to store information that came along with the tweet. The custom metadata fields need to be configured in the `<Elvis Config>/custom-assetinfo.xml` file. Sample configuration files are provided in the `elvis-config` folder.

## 4.2 Install the social import server

The server can either be installed on the Elvis Server or on a separate machine.

- Clone or download this package.
- Open `src/config.ts` and configure the settings. You can either configure the settings in this config file or by setting environment variables.
- Install [nodejs](https://nodejs.org) (8.9.3 or higher).
- Open a terminal and go to the package folder.
- Install TypeScript via npm: `npm install -g typescript`.
- Install node modules: `npm install`.
- Start the server: `npm start`.
- The server is correctly started when a startup message is showed.

## 4.3 Install the Twitter plug-ins

This section describes how to install the Twitter plug-ins.

- Open the `elvis-plugins` folder.
- Copy the `social_api` folder to: `<Elvis Config>/plugins/active`.
- Copy the `twitter` folder to: `<Elvis Config>/plugins/active`.
- [Activate](https://helpcenter.woodwing.com/hc/en-us/articles/115002644606) the plugins.

The Twitter panel should now be available in the Elvis web client.

# 5. Usage & validate installation

- Open the Elvis web client.
- Activate the Twitter panel on the right-hand side.
- Create a new topic by providing a topic name (this is also the name of the folder in Elvis) and one or multiple keywords to search for.
- Choose "Save", the topic is now registered with the social import app. 
- Check the folder in Elvis for new images.
- Clicking an image will show the details of that image in Twitter panel.
- Click on the image in the panel to go to the tweet
- Click on the Google button to search for similar images in Google

Tip 1: Test with a trending hashtag if you want to validate the installation
Tip 2: If either the topic isn't saved or the images are not imported: validate your configuration and check the social import server log for error indicators.

# 6. Privacy and data usage

When using media from social networks, you have to make sure to stay within the privacy and usage policies of these networks.

- [Twitter TOS](https://twitter.com/en/tos)
- [Twitter Developer Policy](https://developer.twitter.com/en/developer-terms/policy)

# 7. Version history

## v1.0.0
- Twitter support